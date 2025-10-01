import { NextRequest, NextResponse } from 'next/server';
import { PrismaNotificationsService } from '@/src/services/prisma';
import { requireAuth } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const result = await PrismaNotificationsService.getNotifications(user.id!);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}
