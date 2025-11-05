import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API route to check maintenance mode status
 * Used by middleware since it can't use Prisma directly in Edge runtime
 */
export async function GET(request: NextRequest) {
  try {
    const platformSettings = await prisma.platformSettings.findFirst();
    
    return NextResponse.json({
      maintenanceMode: platformSettings?.maintenanceMode ?? false,
    });
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // On error, assume maintenance mode is off
    return NextResponse.json({
      maintenanceMode: false,
    });
  }
}

