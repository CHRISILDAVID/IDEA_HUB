export interface WorkspaceFile {
  id: string;
  fileName: string;
  document: any | null;
  whiteboard: any | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
