import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Command {
  id: string;
  type: string;
  execute: () => void;
  undo: () => void;
  description: string;
  timestamp: number;
}

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  maxHistorySize: number;
}

const initialState: HistoryState = {
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    executeCommand: (state, action: PayloadAction<Command>) => {
      const command = action.payload;
      
      // Execute the command
      command.execute();
      
      // Add to undo stack
      state.undoStack.push(command);
      
      // Clear redo stack when new command is executed
      state.redoStack = [];
      
      // Limit history size
      if (state.undoStack.length > state.maxHistorySize) {
        state.undoStack.shift();
      }
    },
    undo: (state) => {
      if (state.undoStack.length > 0) {
        const command = state.undoStack.pop()!;
        command.undo();
        state.redoStack.push(command);
      }
    },
    redo: (state) => {
      if (state.redoStack.length > 0) {
        const command = state.redoStack.pop()!;
        command.execute();
        state.undoStack.push(command);
      }
    },
    clearHistory: (state) => {
      state.undoStack = [];
      state.redoStack = [];
    },
  },
});

export const { executeCommand, undo, redo, clearHistory } = historySlice.actions;
export default historySlice.reducer;