import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Idea } from '../../types';
import { WorkspaceElement, WorkspaceAppState } from '../../components/Workspace/EraserWorkspace';


interface IdeaState {
  currentIdea: Idea | null;
  title: string;
  documentContent: string;
  workspaceElements: WorkspaceElement[];
  workspaceAppState: WorkspaceAppState;
  selectedObjectId: string | null;
  isNewIdea: boolean;
  isDirty: boolean;
}

const initialState: IdeaState = {
  currentIdea: null,
  title: '',
  documentContent: '',
  workspaceElements: [],
  workspaceAppState: {
    viewBackgroundColor: '#ffffff',
    currentItemStrokeColor: '#1e1e1e',
    currentItemBackgroundColor: 'transparent',
    currentItemFillStyle: 'solid',
    currentItemStrokeWidth: 1,
    currentItemRoughness: 1,
    currentItemOpacity: 100,
    currentItemFontFamily: 'Virgil',
    currentItemFontSize: 20,
    currentItemTextAlign: 'left',
    currentItemStartArrowhead: false,
    currentItemEndArrowhead: true,
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 1 },
    shouldCacheIgnoreZoom: false,
    theme: 'light',
    penMode: false,
    activeTool: {
      type: 'selection',
      locked: false,
    },
    penColor: '#000000',
    backgroundColor: '#ffffff',
    exportBackground: true,
    exportEmbedScene: false,
    exportWithDarkMode: false,
    exportScale: 1,
    gridSize: 20,
    showGrid: true,
    snapToGrid: false,
  },
  selectedObjectId: null,
  isNewIdea: false,
  isDirty: false,
};

const ideaSlice = createSlice({
  name: 'idea',
  initialState,
  reducers: {
    loadIdea: (state, action: PayloadAction<Idea>) => {
      const idea = action.payload;
      state.currentIdea = idea;
      state.title = idea.title;
      state.documentContent = idea.content || '';
      
      // Parse workspace data
      try {
        const workspaceData = JSON.parse(idea.canvasData || '{"elements": [], "appState": {}}');
        state.workspaceElements = workspaceData.elements || [];
        state.workspaceAppState = { ...state.workspaceAppState, ...workspaceData.appState };
      } catch {
        state.workspaceElements = [];
      }
      
      state.isNewIdea = false;
      state.isDirty = false;
    },
    createNewIdea: (state, action: PayloadAction<{ title: string; description: string; category: string; tags: string[]; visibility: 'public' | 'private' }>) => {
      const { title, description, category, tags, visibility } = action.payload;
      state.currentIdea = null;
      state.title = title;
      state.documentContent = `# ${title}\n\n${description}\n\n`;
      state.workspaceElements = [];
      state.isNewIdea = true;
      state.isDirty = true;
    },
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
      state.isDirty = true;
    },
    setDocumentContent: (state, action: PayloadAction<string>) => {
      state.documentContent = action.payload;
      state.isDirty = true;
    },
    addWorkspaceElement: (state, action: PayloadAction<WorkspaceElement>) => {
      state.workspaceElements.push(action.payload);
      state.isDirty = true;
    },
    updateWorkspaceElement: (state, action: PayloadAction<{ id: string; changes: Partial<WorkspaceElement> }>) => {
      const { id, changes } = action.payload;
      const index = state.workspaceElements.findIndex(obj => obj.id === id);
      if (index !== -1) {
        state.workspaceElements[index] = { ...state.workspaceElements[index], ...changes };
        state.isDirty = true;
      }
    },
    deleteWorkspaceElement: (state, action: PayloadAction<string>) => {
      state.workspaceElements = state.workspaceElements.filter(obj => obj.id !== action.payload);
      if (state.selectedObjectId === action.payload) {
        state.selectedObjectId = null;
      }
      state.isDirty = true;
    },
    setSelectedObjectId: (state, action: PayloadAction<string | null>) => {
      state.selectedObjectId = action.payload;
    },
    setWorkspaceElements: (state, action: PayloadAction<WorkspaceElement[]>) => {
      state.workspaceElements = action.payload;
      state.isDirty = true;
    },
    setWorkspaceAppState: (state, action: PayloadAction<Partial<WorkspaceAppState>>) => {
      state.workspaceAppState = { ...state.workspaceAppState, ...action.payload };
      state.isDirty = true;
    },
    markSaved: (state) => {
      state.isDirty = false;
    },
    resetIdea: (state) => {
      return initialState;
    },
  },
});

export const {
  loadIdea,
  createNewIdea,
  setTitle,
  setDocumentContent,
  addWorkspaceElement,
  updateWorkspaceElement,
  deleteWorkspaceElement,
  setSelectedObjectId,
  setWorkspaceElements,
  setWorkspaceAppState,
  markSaved,
  resetIdea,
} = ideaSlice.actions;

export default ideaSlice.reducer;