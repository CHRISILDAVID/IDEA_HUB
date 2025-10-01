import { NextRequest, NextResponse } from 'next/server';
import { PrismaIdeasService } from '@/src/services/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      category: searchParams.get('category') || undefined,
      language: searchParams.get('language') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as 'stars' | 'forks' | undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
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
    const ideaData = await request.json();
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id';
    
    const result = await PrismaIdeasService.createIdea(ideaData, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}
