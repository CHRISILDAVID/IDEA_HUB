# Changelog

All notable changes to the IdeaHub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Implemented Redux state management with @reduxjs/toolkit for centralized workspace state
- Created universal IdeaWorkspacePage component replacing multiple page-level implementations
- Added TipTap rich text editor for live document editing with WYSIWYG experience
- Implemented flexible three-view layout system (document, both, canvas)
- Added command pattern for unified undo/redo across document and canvas editors
- Created modular workspace components (WorkspaceTopBar, IdeaName, ViewToggle)
- Implemented two-way data binding between idea title and document first line
- Added auto-save functionality with debounced API calls
- Created centralized canvas state management with Redux

### Changed
- Refactored routing to use single IdeaWorkspacePage for all idea editing scenarios
- Updated all navigation links to point to new workspace routes
- Replaced react-markdown with TipTap for live editing experience
- Consolidated canvas and document editing into unified workspace
- Improved state management architecture with proper separation of concerns

### Removed
- Deleted IdeaDetailPage.tsx, IdeaCanvasPage.tsx, CanvasDemoPage.tsx, and CreatePage.tsx
- Removed old Canvas components that were replaced by workspace components
- Cleaned up duplicated component implementations

### Fixed
- Fixed a bug in the `ensureUserProfile` function in `AuthContext.tsx` where the user creation wasn't properly aligned with the database schema.
- Updated the function to only include required fields (username, email, full_name, id) when creating a new user profile.
- Fixed a bug in the `register` function in `AuthContext.tsx` where the loading state wasn't being reset after successful registration, causing the signup button to show a perpetual loading state.

### Added
- Implemented the previously TODO-marked `updateProfile` function in `AuthContext.tsx` to allow users to update their profile information.
- Added proper error handling for user profile creation and updates.
- Added type assertions to fix TypeScript errors in database operations.

### Changed
- Improved error handling by propagating errors to callers instead of swallowing them.
- Aligned user profile creation with the registration form data collection flow.
