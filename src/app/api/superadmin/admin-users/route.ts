import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hash } from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    // Build where clause to get only admin users
    const where: any = {
      role: {
        in: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get paginated admin users
    const adminUsers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        sessions: {
          where: {
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true,
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get statistics
    const stats = {
      totalAdmins: total,
      superAdmins: await prisma.user.count({
        where: { role: 'SUPER_ADMIN' },
      }),
      tenantAdmins: await prisma.user.count({
        where: { role: 'TENANT_ADMIN' },
      }),
      activeAdmins: await prisma.user.count({
        where: {
          role: { in: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      bannedAdmins: await prisma.user.count({
        where: {
          role: { in: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
          banned: true,
        },
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        adminUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole('SUPER_ADMIN');
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(data.role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be SUPER_ADMIN or TENANT_ADMIN' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create admin user
    const newAdmin = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: new Date(), // Auto-verify admin users
        role: data.role,
        tenantId: data.role === 'TENANT_ADMIN' ? data.tenantId : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create account using BetterAuth (stores password)
    await auth.api.createAccount({
      body: {
        userId: newAdmin.id,
        providerId: 'credential',
        password: hashedPassword,
        accountId: newAdmin.email,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'ADMIN_USER_CREATED',
        entityType: 'User',
        entityId: newAdmin.id,
        newValues: {
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'HIGH',
      },
    });

    return NextResponse.json({
      success: true,
      data: newAdmin,
    });
  } catch (error) {
    console.error('Admin user creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireRole('SUPER_ADMIN');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    // Get user to verify they're an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'User is not an admin' },
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'ADMIN_USER_DELETED',
        entityType: 'User',
        entityId: userId,
        oldValues: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'CRITICAL',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user deleted successfully',
    });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete admin user' },
      { status: 500 }
    );
  }
}
