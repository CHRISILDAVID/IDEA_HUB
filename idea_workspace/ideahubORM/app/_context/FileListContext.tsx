import { createContext } from "react";
import type { WorkspaceFile } from "@/app/(routes)/workspace/_types";

export interface FileListContextValue {
	fileList: WorkspaceFile[];
	setFileList: (files: WorkspaceFile[]) => void;
	reloadFiles: () => Promise<void>;
}

export const FileListContext = createContext<FileListContextValue | undefined>(
	undefined
);
