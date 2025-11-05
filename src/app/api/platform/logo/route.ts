import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join, normalize, basename } from 'path';
import { existsSync } from 'fs';
import { randomBytes } from 'crypto';

/**
 * Upload platform logo
 * POST /api/platform/logo
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type against allowlist
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPG, JPEG, SVG, WEBP' },
        { status: 400 }
      );
    }

    // Map MIME types to safe extensions (don't trust client-provided extensions)
    const extensionMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
    };
    const extension = extensionMap[file.type] || 'png';

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate cryptographically random filename (prevents path traversal)
    const randomName = randomBytes(16).toString('hex');
    const filename = `platform-logo-${randomName}.${extension}`;

    // Define and validate upload directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');
    const filePath = join(uploadsDir, filename);

    // Security: Validate final path is within allowed directory
    const normalizedPath = normalize(filePath);
    const normalizedDir = normalize(uploadsDir);
    if (!normalizedPath.startsWith(normalizedDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to disk
    await writeFile(filePath, buffer);

    // Save to database (we'll use the public URL)
    const publicUrl = `/uploads/logos/${filename}`;
    
    // Update platform settings
    let platformSettings = await prisma.platformSettings.findFirst();
    
    if (platformSettings) {
      // Delete old logo file if it exists
      if (platformSettings.platformLogo && platformSettings.platformLogo.startsWith('/uploads/')) {
        const oldFilename = basename(platformSettings.platformLogo);

        // Security: Validate old filename matches expected pattern before deletion
        if (/^platform-logo-[a-f0-9]{32}\.(png|jpg|svg|webp)$/i.test(oldFilename)) {
          const oldFilePath = join(uploadsDir, oldFilename);
          const normalizedOldPath = normalize(oldFilePath);

          // Security: Ensure old file is within allowed directory
          if (normalizedOldPath.startsWith(normalizedDir) && existsSync(oldFilePath)) {
            try {
              const { unlink } = await import('fs/promises');
              await unlink(oldFilePath);
            } catch (err) {
              // Ignore errors deleting old file
              console.warn('Failed to delete old logo:', err);
            }
          }
        }
      }

      await prisma.platformSettings.update({
        where: { id: platformSettings.id },
        data: { platformLogo: publicUrl }
      });
    } else {
      await prisma.platformSettings.create({
        data: {
          id: 'default-platform-settings',
          platformLogo: publicUrl
        }
      });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Logo uploaded successfully'
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

/**
 * Get platform logo
 * GET /api/platform/logo
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const platformSettings = await prisma.platformSettings.findFirst();

    if (!platformSettings || !platformSettings.platformLogo) {
      return NextResponse.json(
        { success: false, error: 'Logo not found' },
        { status: 404 }
      );
    }

    // Return the logo URL
    return NextResponse.json({
      success: true,
      url: platformSettings.platformLogo
    });
  } catch (error: any) {
    console.error('Get logo error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get logo' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

