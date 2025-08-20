import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Idea } from '../../types';

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'pen' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  opacity: number;
  points?: number[];
  imageUrl?: string;
}

interface IdeaState {
  currentIdea: Idea | null;
  title: string;
  documentContent: string;
  canvasObjects: CanvasObject[];
  selectedObjectId: string | null;
  isNewIdea: boolean;
  isDirty: boolean;
}

const initialState: IdeaState = {
  currentIdea: null,
  title: '',
  documentContent: '',
  canvasObjects: [],
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
      
      // Parse canvas data
      try {
        state.canvasObjects = JSON.parse(idea.canvasData || '[]');
      } catch {
        state.canvasObjects = [];
      }
      
      state.isNewIdea = false;
      state.isDirty = false;
    },
    createNewIdea: (state, action: PayloadAction<{ title: string; description: string; category: string; tags: string[]; visibility: 'public' | 'private' }>) => {
      const { title, description, category, tags, visibility } = action.payload;
      state.currentIdea = null;
      state.title = title;
      state.documentContent = `# ${title}\n\n${description}\n\n`;
      state.canvasObjects = [];
      state.isNewIdea = true;
      state.isDirty = true;
    },
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
      state.isDirty = true;
      
      // Update first line of document content
      const lines = state.documentContent.split('\n');
      if (lines.length > 0) {
        lines[0] = `# ${action.payload}`;
        state.documentContent = lines.join('\n');
      } else {
        state.documentContent = `# ${action.payload}\n\n`;
      }
    },
    setDocumentContent: (state, action: PayloadAction<string>) => {
      state.documentContent = action.payload;
      state.isDirty = true;
      
      // Extract title from first line if it's a heading
      const lines = action.payload.split('\n');
      if (lines.length > 0 && lines[0].startsWith('# ')) {
        const newTitle = lines[0].substring(2).trim();
        if (newTitle !== state.title) {
          state.title = newTitle;
        }
      }
    },
    addCanvasObject: (state, action: PayloadAction<CanvasObject>) => {
      state.canvasObjects.push(action.payload);
      state.isDirty = true;
    },
    updateCanvasObject: (state, action: PayloadAction<{ id: string; changes: Partial<CanvasObject> }>) => {
      const { id, changes } = action.payload;
      const index = state.canvasObjects.findIndex(obj => obj.id === id);
      if (index !== -1) {
        state.canvasObjects[index] = { ...state.canvasObjects[index], ...changes };
        state.isDirty = true;
      }
    },
    deleteCanvasObject: (state, action: PayloadAction<string>) => {
      state.canvasObjects = state.canvasObjects.filter(obj => obj.id !== action.payload);
      if (state.selectedObjectId === action.payload) {
        state.selectedObjectId = null;
      }
      state.isDirty = true;
    },
    setSelectedObjectId: (state, action: PayloadAction<string | null>) => {
      state.selectedObjectId = action.payload;
    },
    setCanvasObjects: (state, action: PayloadAction<CanvasObject[]>) => {
      state.canvasObjects = action.payload;
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
  addCanvasObject,
  updateCanvasObject,
  deleteCanvasObject,
  setSelectedObjectId,
  setCanvasObjects,
  markSaved,
  resetIdea,
} = ideaSlice.actions;

export default ideaSlice.reducer;