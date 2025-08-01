# Create and Edit Features for IdeaHub

This document describes the new create and edit functionality implemented in IdeaHub.

## Create Functionality

### 1. Create Route (`/create`)
- **Route**: `/create`
- **Component**: `CreatePage.tsx`
- **Functionality**: 
  - Redirects authenticated users to `/ideas/new`
  - Redirects unauthenticated users to `/login` with a message
  - Provides loading feedback during redirect

### 2. New Idea Creation (`/ideas/new`)
- **Route**: `/ideas/new`
- **Component**: `IdeaCanvasPage.tsx`
- **Functionality**:
  - Shows setup modal for new idea configuration
  - Allows setting title, description, category, tags, and visibility
  - Provides dual-panel editing interface (document + canvas)
  - Auto-saves changes every 2 seconds
  - Creates the idea in the database when setup is complete

### 3. Setup Modal
- **Component**: `IdeaSetupModal.tsx`
- **Features**:
  - Two-step setup process
  - Category selection with icons
  - Tag management (add/remove tags)
  - Public/private visibility options
  - Form validation

## Edit Functionality

### 1. Edit Route (`/ideas/:id/edit`)
- **Route**: `/ideas/:id/edit`
- **Component**: `IdeaCanvasPage.tsx`
- **Functionality**:
  - Loads existing idea data
  - Provides full editing capabilities
  - Auto-saves changes
  - Maintains edit history

### 2. Edit Button in Idea Detail Page
- **Location**: `IdeaDetailPage.tsx` header
- **Functionality**:
  - Shows "Edit" button for idea authors
  - Shows "Fork & Edit" button for non-authors
  - Redirects to appropriate edit mode
  - Handles authentication checks

### 3. Authorization Logic
- **Author Edit**: Direct edit access for idea creators
- **Non-Author Edit**: Automatic fork creation for other users
- **Unauthenticated**: Redirect to login

## User Flow

### Creating a New Idea
1. User clicks "Create" button in header
2. Redirected to `/create` → `/ideas/new`
3. Setup modal appears with idea configuration
4. User fills in title, description, category, tags, visibility
5. Modal closes, user enters dual-panel editing workspace
6. Auto-save saves changes every 2 seconds
7. Idea is created in database when setup is complete

### Editing an Existing Idea
1. User views idea detail page
2. If user is author: clicks "Edit" button
3. If user is not author: clicks "Fork & Edit" button
4. Redirected to `/ideas/:id/edit`
5. Full editing workspace loads with existing data
6. Changes are auto-saved
7. User can switch between document and canvas views

## Technical Implementation

### Components Added/Modified
- `CreatePage.tsx` - New create route handler
- `IdeaDetailPage.tsx` - Added edit functionality
- `App.tsx` - Added create route
- `IdeaCanvasPage.tsx` - Already existed, handles both create and edit

### Routes Added
```tsx
<Route path="/create" element={<CreatePage />} />
<Route path="/ideas/new" element={<ProtectedRoute><IdeaCanvasPage /></ProtectedRoute>} />
<Route path="/ideas/:id/edit" element={<ProtectedRoute><IdeaCanvasPage /></ProtectedRoute>} />
```

### Key Features
- **Authentication**: All edit/create routes are protected
- **Auto-save**: Changes saved automatically every 2 seconds
- **Dual-panel**: Document editor + Canvas editor
- **View modes**: Document only, Canvas only, or Both
- **Forking**: Non-authors can fork ideas to create their own version
- **Real-time**: Live preview of changes

## Usage Examples

### Create New Idea
```bash
# Navigate to create page
curl http://localhost:5173/create

# Or directly to new idea
curl http://localhost:5173/ideas/new
```

### Edit Existing Idea
```bash
# Edit as author
curl http://localhost:5173/ideas/123/edit

# View idea detail (with edit button)
curl http://localhost:5173/ideas/123
```

## Security Considerations
- All edit/create routes require authentication
- Users can only directly edit their own ideas
- Non-authors must fork to create editable copies
- Auto-save prevents data loss
- Form validation prevents invalid submissions

## Future Enhancements
- Collaborative editing
- Version history
- Real-time collaboration
- Advanced canvas tools
- AI-powered content generation
- Export functionality 