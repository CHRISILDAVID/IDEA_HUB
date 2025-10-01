import { NextRequest, NextResponse } from 'next/server';
import { UsersService } from '../../../src/lib/services/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (userId) {
      const result = await UsersService.getUser(userId);
      return NextResponse.json(result);
    } else if (username) {
      const result = await UsersService.getUserByUsername(username);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: 'userId or username parameter required' },
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...userData } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await UsersService.updateUser(userId, userData);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
