# Canvas Implementation Guide for IdeaHub

This guide explains how to implement the canvas-based idea editor similar to eraser.io in your IdeaHub project.

## Overview

The canvas system consists of two main pages:
1. **IdeaDetailPage** - Read-only view of ideas with document and canvas content
2. **IdeaCanvasPage** - Full editing workspace with dual-panel interface

## New Components Created

### 1. IdeaCanvasPage (`src/pages/IdeaCanvasPage.tsx`)
- Main canvas workspace page
- Dual-panel interface (document + canvas)
- View toggles (Document/Both/Canvas)
- Auto-save functionality
- Setup modal for new ideas

### 2. DocumentEditor (`src/components/Canvas/DocumentEditor.tsx`)
- Markdown editor for the left panel
- Rich text formatting toolbar
- Keyboard shortcuts support
- Floating AI generation button

### 3. DocumentToolbar (`src/components/Canvas/DocumentToolbar.tsx`)
- Horizontal toolbar for document formatting
- Formatting buttons (bold, italic, lists, etc.)
- Help and settings options

### 4. CanvasToolbar (`src/components/Canvas/CanvasToolbar.tsx`)
- Vertical toolbar positioned on canvas
- Drawing tools (select, shapes, text, etc.)
- Tooltips and hover states

### 5. ViewToggle (`src/components/Canvas/ViewToggle.tsx`)
- Toggle between Document/Both/Canvas views
- Styled buttons with active states

### 6. IdeaSetupModal (`src/components/Canvas/IdeaSetupModal.tsx`)
- Modal for new idea setup
- Two-step process (basic info + visibility/tags)
- Category selection with icons
- Tag management

## Database Changes

### 1. Add canvas_data column
```sql
-- Migration: 20250722000000_add_canvas_data.sql
ALTER TABLE public.ideas 
ADD COLUMN canvas_data TEXT;

COMMENT ON COLUMN public.ideas.canvas_data IS 'JSON string containing canvas objects and state';
```

### 2. Update TypeScript types
- Added `canvasData?: string` to the `Idea` interface
- Updated API transformers to handle the new field

## Routing Changes

### Updated App.tsx routes:
```tsx
// Public read-only view
<Route path="/ideas/:id" element={<IdeaDetailPage />} />

// Protected edit views
<Route path="/ideas/:id/edit" element={
  <ProtectedRoute>
    <IdeaCanvasPage />
  </ProtectedRoute>
} />
<Route path="/ideas/new" element={
  <ProtectedRoute>
    <IdeaCanvasPage />
  </ProtectedRoute>
} />
```

## Key Features Implemented

### 1. Dual-Panel Interface
- Left panel: Document editor with markdown support
- Right panel: Infinite canvas with drawing tools
- Resizable panels with view toggles

### 2. Canvas Tools
- Select tool for moving/resizing objects
- Shape tools (rectangle, circle, diamond)
- Text tool with double-click editing
- Line/connector tool
- Image upload support
- Comment tool

### 3. Document Editor
- Markdown syntax highlighting
- Rich text formatting toolbar
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- Auto-save functionality

### 4. Idea Management
- Setup modal for new ideas
- Category and tag selection
- Public/private visibility options
- Auto-save with 2-second delay

### 5. Read-Only View
- Prominent "Extend This Idea" button
- Fork functionality to create editable copy
- View-only canvas and document panels

## Implementation Steps

### 1. Database Setup
```bash
# Run the migration
supabase db push
```

### 2. Install Dependencies
```bash
npm install react-konva konva uuid
```

### 3. Update Existing Files
- Update `App.tsx` with new routes
- Update `types/index.ts` with canvasData field
- Update API services to handle canvas data

### 4. Create New Components
- All canvas components are created and ready to use
- Components follow the existing project structure and styling

### 5. Test the Implementation
```bash
npm run dev
```

## Usage Flow

### Creating a New Idea
1. Navigate to `/ideas/new`
2. Setup modal appears with title, description, category
3. Choose visibility and add tags
4. Enter the canvas workspace
5. Edit document and canvas simultaneously
6. Auto-save every 2 seconds

### Viewing an Idea
1. Navigate to `/ideas/:id`
2. View document and canvas in read-only mode
3. Click "Extend This Idea" to fork and edit

### Editing an Idea
1. Navigate to `/ideas/:id/edit`
2. Full canvas workspace with all tools
3. Switch between Document/Both/Canvas views
4. Real-time auto-save

## Canvas Data Structure

The canvas data is stored as a JSON string in the `canvas_data` column:

```typescript
interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'diamond';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  points?: number[];
}
```

## Styling and Theme

All components use Tailwind CSS classes and support:
- Light/dark mode
- Responsive design
- Consistent with existing design system
- Hover states and transitions

## Future Enhancements

1. **Real-time Collaboration**
   - WebSocket integration for live editing
   - Cursor presence indicators
   - Conflict resolution

2. **Advanced Canvas Features**
   - More shape types (polygons, curves)
   - Layer management
   - Undo/redo functionality
   - Export to various formats

3. **AI Integration**
   - AI-powered diagram generation
   - Smart layout suggestions
   - Content analysis and recommendations

4. **Performance Optimizations**
   - Virtual scrolling for large canvases
   - Object pooling for better memory usage
   - Lazy loading of canvas objects

## Troubleshooting

### Common Issues

1. **Canvas not rendering**
   - Check if react-konva is installed
   - Verify Stage and Layer components are imported

2. **Auto-save not working**
   - Check authentication status
   - Verify API endpoints are working
   - Check browser console for errors

3. **Styling issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS classes

### Debug Tips

1. Use browser dev tools to inspect canvas elements
2. Check Network tab for API calls
3. Monitor console for JavaScript errors
4. Test with different screen sizes

## Conclusion

This implementation provides a solid foundation for a canvas-based idea editor. The modular component structure makes it easy to extend and customize. The dual-panel interface allows users to work with both text and visual content simultaneously, making it perfect for brainstorming and idea development.

The system is designed to be scalable and can be easily extended with additional features like real-time collaboration, AI integration, and advanced canvas tools. 