import { NextRequest, NextResponse } from 'next/server';
import { PrismaUsersService } from '@/src/services/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (query) {
      const result = await PrismaUsersService.searchUsers(query);
      return NextResponse.json(result);
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Query parameter is required' 
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}
