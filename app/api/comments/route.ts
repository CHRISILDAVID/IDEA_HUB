import { NextRequest, NextResponse } from 'next/server';
import { CommentsService } from '../../../src/lib/services/comments';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json(
        { success: false, message: 'ideaId parameter is required' },
        { status: 400 }
      );
    }

    const result = await CommentsService.getIdeaComments(ideaId);
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
    const { content, authorId, ideaId, parentId } = body;

    if (!content || !authorId || !ideaId) {
      return NextResponse.json(
        { success: false, message: 'content, authorId, and ideaId are required' },
        { status: 400 }
      );
    }

    const result = await CommentsService.createComment(
      content,
      authorId,
      ideaId,
      parentId
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
