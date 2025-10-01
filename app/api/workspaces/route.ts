import { NextRequest, NextResponse } from 'next/server';
import { PrismaWorkspacesService } from '@/src/services/prisma';
import { requireAuth } from '@/src/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const result = await PrismaWorkspacesService.getUserWorkspaces(user.id!);
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, content, isPublic } = await request.json();
    
    const result = await PrismaWorkspacesService.createWorkspace(name, user.id!, content, isPublic);
    return NextResponse.json(result, { status: 201 });
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
