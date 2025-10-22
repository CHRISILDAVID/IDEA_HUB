export interface WorkspaceFile {
  id: string;
  name: string;
  ideaId: string;
  userId: string;
  document: any | null;
  whiteboard: any | null;
  thumbnail?: string | null;
  isPublic: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  idea?: {
    id: string;
    title: string;
    authorId: string;
    visibility: string;
    author: {
      id: string;
      username: string;
      fullName: string;
    };
    collaborators?: Array<{
      userId: string;
      role: string;
    }>;
  };
}
