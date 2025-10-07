"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkSpaceHeader from "../_components/WorkSpaceHeader";
import dynamic from "next/dynamic";
import { WorkspaceFile } from "../_types";

type SavingState = "idle" | "saving" | "saved" | "error";
type EditorComponentProps = {
  onSaveTrigger: any;
  fileId: any;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
  onSavingStateChange?: (state: SavingState) => void;
};
type CanvasComponentProps = {
  onSaveTrigger: any;
  fileId: string;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
  onSavingStateChange?: (state: SavingState) => void;
};

const Editor = dynamic<EditorComponentProps>(() => import("../_components/Editor"), {
  ssr: false,
});

const Canvas = dynamic<CanvasComponentProps>(() => import("../_components/Canvas"), {
  ssr: false,
});

const Workspace = ({ params }: any) => {
  const searchParams = useSearchParams();
  const [fileData, setfileData] = useState<WorkspaceFile | null>(null);

  // Get query parameters for iframe integration
  const mode = searchParams.get('mode') || 'edit';
  const readOnly = searchParams.get('readOnly') === 'true' || mode === 'view';
  const token = searchParams.get('token');

  useEffect(() => {
    if (!params?.fileId) return;

    const fetchFileData = async () => {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if provided
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/workspace/${params.fileId}`, { headers });
      if (!res.ok) return;
      const file = await res.json();
      setfileData(file);
    };

    fetchFileData();
  }, [params?.fileId, token]);

  // Notify parent window when loaded (for iframe integration)
  useEffect(() => {
    if (fileData && typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        { type: 'WORKSPACE_LOADED', source: 'workspace' },
        '*' // In production, specify parent origin
      );
    }
  }, [fileData]);

  const Tabs = [
    {
      name: "Document",
    },
    {
      name: "Both",
    },
    {
      name: "Canvas",
    },
  ];

  const [activeTab, setActiveTab] = useState(Tabs[1].name);
  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const handleFileUpdate = useCallback((data: WorkspaceFile) => {
    setfileData(data);
    
    // Notify parent window of save success (for iframe integration)
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        { 
          type: 'SAVE_SUCCESS', 
          payload: { timestamp: new Date(), workspaceId: data.id },
          source: 'workspace' 
        },
        '*'
      );
    }
  }, []);

  return (
    <div className="overflow-hidden w-full">
      <WorkSpaceHeader
        Tabs={Tabs}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        savingState={savingState}
        file={fileData}
      />
      {activeTab === "Document" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
          }}
        >
          {fileData && (
            <Editor
              onSaveTrigger={false}
              fileId={params.fileId}
              fileData={fileData as any}
              onFileUpdate={handleFileUpdate}
              onSavingStateChange={setSavingState}
            />
          )}
        </div>
      ) : activeTab === "Both" ? (
        <ResizablePanelGroup
          style={{
            height: "calc(100vh - 3rem)",
          }}
          direction="horizontal"
        >
          <ResizablePanel defaultSize={50} minSize={40} collapsible={false}>
            {fileData && (
              <Editor
                onSaveTrigger={false}
                fileId={params.fileId}
                fileData={fileData as any}
                onFileUpdate={handleFileUpdate}
                onSavingStateChange={setSavingState}
              />
            )}
          </ResizablePanel>
          <ResizableHandle className=" bg-neutral-600" />
          <ResizablePanel defaultSize={50} minSize={45}>
            {fileData && (
              <Canvas
                onSaveTrigger={false}
                fileId={params.fileId}
                fileData={fileData as any}
                onFileUpdate={handleFileUpdate}
                onSavingStateChange={setSavingState}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : activeTab === "Canvas" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
          }}
        >
          {fileData && (
            <Canvas
              onSaveTrigger={false}
              fileId={params.fileId}
              fileData={fileData as any}
              onFileUpdate={handleFileUpdate}
              onSavingStateChange={setSavingState}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Workspace;
