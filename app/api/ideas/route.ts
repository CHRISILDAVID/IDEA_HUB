import { NextRequest, NextResponse } from 'next/server';
import { IdeasService } from '../../../src/lib/services/ideas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const language = searchParams.get('language') || undefined;
    const query = searchParams.get('query') || undefined;
    const sort = searchParams.get('sort') as 'newest' | 'oldest' | 'most-stars' | 'most-forks' | 'recently-updated' | undefined;

    const filters = {
      category,
      language,
      query,
      sort,
    };

    const result = await IdeasService.getIdeas(filters);
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
    // TODO: Get userId from session/auth
    const userId = body.userId; // Temporary, should come from auth

    const result = await IdeasService.createIdea(body, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
