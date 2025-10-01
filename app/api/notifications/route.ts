import { NextRequest, NextResponse } from 'next/server';
import { PrismaNotificationsService } from '@/src/services/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id';
    
    const result = await PrismaNotificationsService.getNotifications(userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}
