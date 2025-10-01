import { NextRequest, NextResponse } from 'next/server';
import { NotificationsService } from '../../../src/lib/services/notifications';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const onlyUnread = searchParams.get('onlyUnread') === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const result = await NotificationsService.getUserNotifications(userId, onlyUnread);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, message, relatedUserId, relatedIdeaId, relatedUrl } = body;

    if (!userId || !type || !message) {
      return NextResponse.json(
        { success: false, message: 'userId, type, and message are required' },
        { status: 400 }
      );
    }

    const result = await NotificationsService.createNotification(
      userId,
      type,
      message,
      relatedUserId,
      relatedIdeaId,
      relatedUrl
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAllAsRead, userId } = body;

    if (markAllAsRead && userId) {
      const result = await NotificationsService.markAllAsRead(userId);
      return NextResponse.json(result);
    } else if (notificationId) {
      const result = await NotificationsService.markAsRead(notificationId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: 'notificationId or userId+markAllAsRead required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
