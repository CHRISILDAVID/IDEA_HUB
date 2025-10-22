"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkSpaceHeader from "../_components/WorkSpaceHeader";
import dynamic from "next/dynamic";
import { WorkspaceFile } from "../_types";
import { useSearchParams } from "next/navigation";

type SavingState = "idle" | "saving" | "saved" | "error";
type EditorComponentProps = {
  onSaveTrigger: any;
  fileId: any;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
  onSavingStateChange?: (state: SavingState) => void;
  readonly?: boolean;
};
type CanvasComponentProps = {
  onSaveTrigger: any;
  fileId: string;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
  onSavingStateChange?: (state: SavingState) => void;
  readonly?: boolean;
};

const Editor = dynamic<EditorComponentProps>(() => import("../_components/Editor"), {
  ssr: false,
});

const Canvas = dynamic<CanvasComponentProps>(() => import("../_components/Canvas"), {
  ssr: false,
});

const Workspace = ({ params }: any) => {
  const searchParams = useSearchParams();
  const readonly = searchParams.get('readonly') === 'true';
  const [fileData, setfileData] = useState<WorkspaceFile | null>(null);

  useEffect(() => {
    if (!params?.fileId) return;

    const fetchFileData = async () => {
      const res = await fetch(`/api/workspace/${params.fileId}`);
      if (!res.ok) return;
      const file = await res.json();
      setfileData(file);
    };

    fetchFileData();
  }, [params?.fileId]);
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
  }, []);

  return (
    <div className="overflow-hidden w-full">
      {readonly && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center">
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Viewing in read-only mode
          </span>
        </div>
      )}
      <WorkSpaceHeader
        Tabs={Tabs}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        savingState={savingState}
        file={fileData}
        readonly={readonly}
      />
      {activeTab === "Document" ? (
        <div
          style={{
            height: readonly ? "calc(100vh - 6rem)" : "calc(100vh - 3rem)",
          }}
        >
          {fileData && (
            <Editor
              onSaveTrigger={false}
              fileId={params.fileId}
              fileData={fileData as any}
              onSavingStateChange={setSavingState}
              readonly={readonly}
            />
          )}
        </div>
      ) : activeTab === "Both" ? (
        <ResizablePanelGroup
          style={{
            height: readonly ? "calc(100vh - 6rem)" : "calc(100vh - 3rem)",
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
                readonly={readonly}
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
                readonly={readonly}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : activeTab === "Canvas" ? (
        <div
          style={{
            height: readonly ? "calc(100vh - 6rem)" : "calc(100vh - 3rem)",
          }}
        >
          {fileData && (
            <Canvas
              onSaveTrigger={false}
              fileId={params.fileId}
              fileData={fileData as any}
              onFileUpdate={handleFileUpdate}
              onSavingStateChange={setSavingState}
              readonly={readonly}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Workspace;
