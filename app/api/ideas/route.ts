import { NextRequest, NextResponse } from 'next/server';
import { PrismaIdeasService } from '@/src/services/prisma';
import { getCurrentUser } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      category: searchParams.get('category') || undefined,
      language: searchParams.get('language') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as 'stars' | 'forks' | undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      userId: user?.id,
    };

    const result = await PrismaIdeasService.getIdeas(filters);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const ideaData = await request.json();
    const result = await PrismaIdeasService.createIdea(ideaData, user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}
