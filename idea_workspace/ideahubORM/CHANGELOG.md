# Changelog

All notable changes in this workspace are documented here.

## 2025-09-28 11:42 IST

Summary of updates implemented during this session (grouped as one change):

- Autosave + Local Cache
  - Added autosave for Document (Editor.js) and Canvas (Excalidraw) after ~3.5s of inactivity.
  - Cached unsaved changes to localStorage with keys `workspace:<fileId>:document` and `workspace:<fileId>:whiteboard`.
  - On load, prefer local cache first; clear cache after successful save.
  - Debounced localStorage writes (Editor ~300ms, Canvas ~400ms) to reduce memory/CPU churn.
  - Added retry on failed autosaves with exponential backoff (1s, 2s, 4s; up to 3 attempts).

- Saving Indicator (Header)
  - Replaced manual Save button with a status indicator: “Saving…”, “Saved”, “Save failed, retrying…”, or “Idle”.
  - Wired saving state from Editor/Canvas up to the header via the workspace page.

- Canvas Improvements (Excalidraw)
  - Persist and restore images by saving the `files` map along with `elements` so images survive refresh.
  - Prevented render/update loops by: using a stable `initialData` (computed once per file), avoiding React state updates on every `onChange` (use refs instead), and cleaning up timers on unmount.
  - Debounced autosave and local cache writes; removed frequent success toasts to avoid noise.

- Editor Improvements (Editor.js)
  - Prevented duplicate content and multiple prompts by using:
    - Single-initialization guard and `destroy()` on unmount.
    - Unique holder id per instance (avoids collisions across tabs/routes).
  - Prefer local cache on init; added debounced autosave; clear cache on successful save.

- API Safety
  - Updated `/api/workspace/[id]/PATCH` to only update provided fields, preventing unintended field resets when `undefined` was passed.

- Documentation
  - Updated README with autosave/local cache behavior and recovery notes.

Affected files (primary):

- `app/(routes)/workspace/_components/Editor.tsx`
- `app/(routes)/workspace/_components/Canvas.tsx`
- `app/(routes)/workspace/_components/WorkSpaceHeader.tsx`
- `app/(routes)/workspace/[fileId]/page.tsx`
- `app/api/workspace/[id]/route.ts`
- `README.md`

Notes:
- Existing documents that already had duplicated blocks will still display duplicates until cleaned; the new Editor logic prevents future duplication.
- For very large scenes/images, consider moving binary assets to external storage and referencing URLs to further reduce JSON size.
