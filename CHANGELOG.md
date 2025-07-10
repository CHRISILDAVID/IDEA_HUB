# Changelog

All notable changes to the IdeaHub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
