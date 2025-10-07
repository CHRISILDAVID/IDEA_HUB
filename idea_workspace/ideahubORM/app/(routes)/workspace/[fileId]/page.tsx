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
