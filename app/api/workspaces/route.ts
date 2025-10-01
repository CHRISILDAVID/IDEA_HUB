import { NextRequest, NextResponse } from 'next/server';
import { WorkspacesService } from '../../../src/lib/services/workspaces';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');

    if (workspaceId) {
      const result = await WorkspacesService.getWorkspace(workspaceId, userId || undefined);
      return NextResponse.json(result);
    } else if (userId) {
      const result = await WorkspacesService.getUserWorkspaces(userId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: 'userId or workspaceId parameter required' },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, content, isPublic } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, message: 'userId and name are required' },
        { status: 400 }
      );
    }

    const result = await WorkspacesService.createWorkspace(
      userId,
      name,
      content,
      isPublic
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
    const { workspaceId, userId, ...data } = body;

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, message: 'workspaceId and userId are required' },
        { status: 400 }
      );
    }

    const result = await WorkspacesService.updateWorkspace(workspaceId, userId, data);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, message: 'workspaceId and userId are required' },
        { status: 400 }
      );
    }

    const result = await WorkspacesService.deleteWorkspace(workspaceId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
