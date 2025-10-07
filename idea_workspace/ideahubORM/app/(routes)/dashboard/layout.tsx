"use client";

import Sidebar from "@/app/_components/Sidebar";
import { FileListContext } from "@/app/_context/FileListContext";
import type { WorkspaceFile } from "../workspace/_types";
import { useCallback, useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [fileList, setFileListState] = useState<WorkspaceFile[]>([]);

  const reloadFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace", {
        next: { revalidate: 0 },
      });
      if (!response.ok) {
        throw new Error("Failed to load files");
      }
      const data: WorkspaceFile[] = await response.json();
      setFileListState(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    reloadFiles();
  }, [reloadFiles]);

  const setFileList = (files: WorkspaceFile[]) => {
    setFileListState(files);
  };

  return (
    <div className="h-screen overscroll-x-none" suppressHydrationWarning>
      <FileListContext.Provider
        value={{
          fileList,
          setFileList,
          reloadFiles,
        }}
      >
        <div className="grid sm:grid-cols-5">
          <div className="sm:col-span-1">
            <Sidebar />
          </div>
          <div className="sm:col-span-4 h-screen w-full overscroll-x-none overflow-y-auto">
            {children}
          </div>
        </div>
      </FileListContext.Provider>
    </div>
  );
}
