"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { toast } from "sonner";
import { WorkspaceFile } from "../_types";

const Canvas = ({
  onSaveTrigger,
  fileId,
  fileData,
  onFileUpdate,
  onSavingStateChange,
}: {
  onSaveTrigger: any;
  fileId: string;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
  onSavingStateChange?: (state: "idle" | "saving" | "saved" | "error") => void;
}) => {
  // Store whiteboard content in a ref to avoid rerender loops
  const whiteboardRef = useRef<any>(undefined);
  const localKey = `workspace:${fileId}:whiteboard`;
  const idleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localWriteDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialSceneRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Compute initial scene only once per fileId to avoid re-mount/update loops
  if (!initialSceneRef.current) {
    const fromCache =
      typeof window !== "undefined"
        ? (() => {
            try {
              const cached = window.localStorage.getItem(localKey);
              return cached ? (JSON.parse(cached) as any) : null;
            } catch {
              return null;
            }
          })()
        : null;
    const fromDb = fileData?.whiteboard as any;
    const elements = Array.isArray(fromCache?.elements)
      ? fromCache.elements
      : Array.isArray(fromCache)
      ? fromCache
      : Array.isArray(fromDb?.elements)
      ? fromDb.elements
      : Array.isArray(fromDb)
      ? fromDb
      : undefined;
    const files = fromCache?.files || fromDb?.files || undefined;
    initialSceneRef.current = { elements, files } as any;
  }

  // If fileId changes, recompute initial scene for the new file
  useEffect(() => {
    initialSceneRef.current = null;
  }, [fileId]);

  // Cleanup timers and mark unmounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (localWriteDebounceRef.current) clearTimeout(localWriteDebounceRef.current);
    };
  }, []);

  const persist = async () => {
    const payload = whiteboardRef.current;
    if (!payload) return;
    try {
      if (mountedRef.current) onSavingStateChange?.("saving");
      const res = await fetch(`/api/workspace/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whiteboard: payload }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updatedFile = (await res.json()) as WorkspaceFile;
      if (mountedRef.current) onFileUpdate?.(updatedFile);
      if (mountedRef.current) onSavingStateChange?.("saved");
      try {
        window.localStorage.removeItem(localKey);
      } catch {}
      // Avoid success toast spam during autosave
    } catch (error) {
      if (mountedRef.current) onSavingStateChange?.("error");
      // basic retry with backoff up to 3 attempts
      const retries = Math.min(retryCountRef.current + 1, 3);
      retryCountRef.current = retries;
      const backoff = Math.pow(2, retries - 1) * 1000; // 1s,2s,4s
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        persist();
      }, backoff);
      // Show a single error toast at most
      try { toast.error("Error saving canvas"); } catch {}
    }
  };

  return (
    <>
      <div className="h-full w-full">
        <Excalidraw
          theme="dark"
          initialData={initialSceneRef.current}
          UIOptions={{
            canvasActions: {
              export: false,
              loadScene: false,
              saveAsImage: false,
            },
          }}
          onChange={(excaliDrawElements, appState, files) => {
            const whiteboardPayload = { elements: excaliDrawElements, files } as any;
            whiteboardRef.current = whiteboardPayload;
            // Debounce local cache writes to reduce churn
            if (localWriteDebounceRef.current) clearTimeout(localWriteDebounceRef.current);
            localWriteDebounceRef.current = setTimeout(() => {
              try {
                window.localStorage.setItem(
                  localKey,
                  JSON.stringify(whiteboardPayload)
                );
              } catch {}
            }, 400);
            // Debounce autosave for ~3.5s idle
            if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current);
            idleDebounceRef.current = setTimeout(() => {
              if (!mountedRef.current) return;
              persist();
            }, 3500);
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.Help />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.ToolbarHint />
            <WelcomeScreen.Hints.HelpHint />
          </WelcomeScreen>
        </Excalidraw>
      </div>
    </>
  );
};

export default Canvas;
