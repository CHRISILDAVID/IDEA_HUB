import { NextRequest, NextResponse } from 'next/server';
import { PrismaWorkspacesService } from '@/src/services/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id';
    
    const result = await PrismaWorkspacesService.getUserWorkspaces(userId);
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
    const { name, content, isPublic } = await request.json();
    // TODO: Get userId from session/auth
    const userId = 'temp-user-id';
    
    const result = await PrismaWorkspacesService.createWorkspace(name, userId, content, isPublic);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}
