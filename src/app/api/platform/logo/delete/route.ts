import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Delete platform logo
 * DELETE /api/platform/logo/delete
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    // Get current logo
    const platformSettings = await prisma.platformSettings.findFirst();

    if (!platformSettings || !platformSettings.platformLogo) {
      return NextResponse.json(
        { error: 'No logo to delete' },
        { status: 404 }
      );
    }

    // Delete file if it exists
    if (platformSettings.platformLogo.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', platformSettings.platformLogo);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (err) {
          console.warn('Failed to delete logo file:', err);
        }
      }
    }

    // Update database
    await prisma.platformSettings.update({
      where: { id: platformSettings.id },
      data: { platformLogo: null }
    });

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete logo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete logo' },
      { status: 500 }
    );
  }
}

