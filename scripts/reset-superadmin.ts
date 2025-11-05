import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

// Create readline interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function resetSuperAdmin() {
  console.log('🔧 Super Admin Account Creator\n');

  try {
    // Get email
    const email = await question('Enter super admin email (default: superadmin@azaire.com): ');
    const superAdminEmail = email.trim() || 'superadmin@azaire.com';

    // Get password
    const password = await question('Enter super admin password: ');
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Get name
    const name = await question('Enter super admin name (default: Super Admin): ');
    const superAdminName = name.trim() || 'Super Admin';

    console.log('\n🔍 Checking for existing super admin...');

    // Find existing super admin
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super admin with this email already exists!');
      const confirm = await question('Delete and recreate? (yes/no): ');

      if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        process.exit(0);
      }

      console.log('🗑️  Deleting existing super admin and accounts...');

      // Delete all sessions
      await prisma.session.deleteMany({
        where: { userId: existingSuperAdmin.id },
      });

      // Delete all accounts
      await prisma.account.deleteMany({
        where: { userId: existingSuperAdmin.id },
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: existingSuperAdmin.id },
      });

      console.log('✅ Deleted existing super admin');
    }

    console.log('\n👤 Creating super admin account using BetterAuth...');

    // Use BetterAuth's internal signUp to create the account properly
    // This ensures the password is hashed in the format BetterAuth expects
    const { user: createdUser, error } = await auth.api.signUpEmail({
      body: {
        email: superAdminEmail,
        password: password,
        name: superAdminName,
      }
    });

    if (error) {
      console.error('❌ Error creating account:', error);
      throw new Error(`Failed to create account: ${error.message}`);
    }

    if (!createdUser) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('✅ Created user account');

    // Update user to SUPER_ADMIN role and verify email
    console.log('🔐 Setting SUPER_ADMIN role and verifying email...');
    const updatedUser = await prisma.user.update({
      where: { id: createdUser.id },
      data: {
        role: 'SUPER_ADMIN',
        emailVerified: true,
      },
    });

    console.log('✅ Updated to SUPER_ADMIN role');

    // Verify the account exists
    const verifyAccount = await prisma.account.findFirst({
      where: {
        userId: updatedUser.id,
        providerId: 'credential',
      },
    });

    if (!verifyAccount || !verifyAccount.password) {
      throw new Error('Failed to verify account creation');
    }

    console.log('✅ Verified credential account exists');
    console.log('\n🎉 Super Admin created successfully!\n');
    console.log('📧 Email:', superAdminEmail);
    console.log('👤 Name:', superAdminName);
    console.log('🔒 Password: [hidden]');
    console.log('');
    console.log('✨ You can now login at /auth/sign-in');
    console.log('⚠️  Store the password securely and change it after first login!');
  } catch (error) {
    console.error('\n❌ Error creating super admin:', error);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

resetSuperAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
