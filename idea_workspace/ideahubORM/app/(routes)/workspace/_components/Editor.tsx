"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import EditorJs from "@editorjs/editorjs";
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import checkList from "@editorjs/checklist";
import { Edu_QLD_Beginner } from "next/font/google";
import { toast } from "sonner";
import { WorkspaceFile } from "../_types";

const rawDocument = {
  time: 1550476186479,
  blocks: [
    {
      id: "oUq2g_tl8y",
      type: "header",
      data: {
        text: "Untitled Document",
        level: 2,
      },
    },
  ],
  version: "2.8.1",
};

const Editor = ({
  onSaveTrigger,
  fileId,
  fileData,
  onFileUpdate,
}: {
  onSaveTrigger: any;
  fileId: any;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
}) => {
  const ref = useRef<EditorJs>();
  const isInitialized = useRef(false);
  const holderIdRef = useRef<string>(`editorjs-${fileId}-${Math.random()
    .toString(36)
    .slice(2)}`);
  const [document, setDocument] = useState(rawDocument);

  const localKey = `workspace:${fileId}:document`;
  const idleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const localWriteDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const saveDocument = async (id: string, data: any) => {
    const res = await fetch(`/api/workspace/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: data }),
    });
    if (!res.ok) throw new Error("Failed to save");
    return res.json();
  };

  const initEditor = useCallback(() => {
    // Avoid initializing more than once per mount
    if (isInitialized.current || ref.current) return;
    const editor = new EditorJs({
      holder: holderIdRef.current,
      placeholder: "Start cooking...",
      tools: {
        header: {
          // @ts-ignore
          class: Header,
          inlineToolbar: true,
          shortcut: "CMD+SHIFT+H",
          placeholder: "Enter a heading",
        },
        list: List,
        checklist: checkList,
      },
      data:
        // Prefer locally cached unsaved data first
        (typeof window !== "undefined"
          ? (() => {
              try {
                const cached = window.localStorage.getItem(localKey);
                return cached ? JSON.parse(cached) : null;
              } catch {
                return null;
              }
            })()
          : null) || (fileData && fileData.document ? fileData.document : document),
      onChange: async () => {
        if (!ref.current) return;
        const data = await ref.current.save();
        // Debounce local cache write to avoid heavy frequent JSON stringify
        if (localWriteDebounceRef.current) clearTimeout(localWriteDebounceRef.current);
        localWriteDebounceRef.current = setTimeout(() => {
          try {
            // Always overwrite the cache with the latest snapshot
            window.localStorage.setItem(localKey, JSON.stringify(data));
          } catch {}
        }, 300);

        if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current);
        idleDebounceRef.current = setTimeout(async () => {
          if (!ref.current) return;
          try {
            const latest = await ref.current.save();
            await saveDocument(fileId, latest);
            retryCountRef.current = 0;
            try {
              window.localStorage.removeItem(localKey);
            } catch {}
          } catch (e) {
            const retries = Math.min(retryCountRef.current + 1, 3);
            retryCountRef.current = retries;
          }
        }, 1500);
      },
    });
    editor.isReady.then(() => {
      ref.current = editor;
      isInitialized.current = true;
    });
  }, [document, fileData]);

  const onDocumentSave = useCallback(async () => {
    if (!ref.current) return;
    const savedData = await ref.current.save();
    const updatedFile = await saveDocument(fileId, savedData);
    onFileUpdate?.(updatedFile as WorkspaceFile);
    toast.success("Document Saved");
  }, [fileId, onFileUpdate]);

  useEffect(() => {
    if (fileData) {
      initEditor();
    }
  }, [fileData, initEditor]);

  // Cleanup on unmount to avoid duplicate toolbars/blocks on remount
  useEffect(() => {
    return () => {
      try {
        ref.current?.destroy?.();
      } catch {}
      // reset flags
      ref.current = undefined as unknown as EditorJs;
      isInitialized.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    onDocumentSave();
  }, [onDocumentSave, onSaveTrigger]);

  return (
    <div className="p-2">
      <div
        className="text-white selection:text-black selection:bg-neutral-400 overflow-x-hidden overflow-y-auto w-full pr-4 pl-2 h-[85vh] mb-4"
        id={holderIdRef.current}
        key={holderIdRef.current}
      ></div>
    </div>
  );
};

export default Editor;
