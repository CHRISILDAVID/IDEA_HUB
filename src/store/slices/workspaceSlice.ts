import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewMode = 'document' | 'both' | 'canvas';
export type ActiveEditor = 'document' | 'canvas';
export type WorkspaceTool = 'selection' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'pen' | 'image';

interface ClipboardData {
  type: 'text' | 'canvas-objects';
  data: any;
}

interface WorkspaceState {
  viewMode: ViewMode;
  activeEditor: ActiveEditor;
  activeTool: WorkspaceTool;
  clipboard: ClipboardData | null;
  documentPanelWidth: number; // percentage (0-100)
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: string | null;
}

const initialState: WorkspaceState = {
  viewMode: 'both',
  activeEditor: 'document',
  activeTool: 'selection',
  clipboard: null,
  documentPanelWidth: 50,
  isLoading: false,
  isSaving: false,
  lastSaved: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
      // Auto-focus appropriate editor based on view mode
      if (action.payload === 'document') {
        state.activeEditor = 'document';
      } else if (action.payload === 'canvas') {
        state.activeEditor = 'canvas';
      }
    },
    setActiveEditor: (state, action: PayloadAction<ActiveEditor>) => {
      state.activeEditor = action.payload;
    },
    setActiveTool: (state, action: PayloadAction<CanvasTool>) => {
      state.activeTool = action.payload;
      // When selecting a tool, focus the canvas
      if (action.payload !== 'selection') {
        state.activeEditor = 'canvas';
      }
    },
    setClipboard: (state, action: PayloadAction<ClipboardData | null>) => {
      state.clipboard = action.payload;
    },
    setDocumentPanelWidth: (state, action: PayloadAction<number>) => {
      state.documentPanelWidth = Math.max(20, Math.min(80, action.payload));
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    setLastSaved: (state, action: PayloadAction<string>) => {
      state.lastSaved = action.payload;
    },
  },
});

export const {
  setViewMode,
  setActiveEditor,
  setActiveTool,
  setClipboard,
  setDocumentPanelWidth,
  setLoading,
  setSaving,
  setLastSaved,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;