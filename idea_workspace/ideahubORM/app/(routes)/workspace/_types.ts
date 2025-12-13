/**
 * Workspace type - represents a workspace linked to an Idea
 * This is the unified workspace model used across both services
 */
export interface WorkspaceFile {
  id: string;
  name: string;         // Workspace name (typically same as idea title)
  ideaId: string;       // Link to the parent Idea in main app
  userId: string;       // Owner of the workspace
  document: any | null; // EditorJS content
  whiteboard: any | null; // Excalidraw content
  thumbnail?: string | null;
  isPublic: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alias for backwards compatibility
export type Workspace = WorkspaceFile;
