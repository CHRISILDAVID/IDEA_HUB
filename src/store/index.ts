import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './slices/workspaceSlice';
import historyReducer from './slices/historySlice';
import ideaReducer from './slices/ideaSlice';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    history: historyReducer,
    idea: ideaReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['history/executeCommand', 'history/undo', 'history/redo'],
        ignoredPaths: ['history.undoStack', 'history.redoStack'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;