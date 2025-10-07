"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { FileListContext } from "../_context/FileListContext";

const Sidebar = () => {
  const context = useContext(FileListContext);
  if (!context) {
    throw new Error("Sidebar must be used within FileListContext provider");
  }

  const { fileList, setFileList, reloadFiles } = context;
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: "Untitled" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create file");
      }

      const created = await response.json();
      setFileList([created, ...fileList]);
      toast.success("File created");
      router.push(`/workspace/${created.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to create file");
    } finally {
      setIsCreating(false);
      reloadFiles();
    }
  };

  return (
    <aside className="hidden h-screen max-w-64 border-r border-neutral-800 bg-neutral-950 px-4 py-6 text-white sm:fixed sm:flex sm:flex-col">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <Image
            src="/IDEAHUB.svg"
            alt="IDEAHUB"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="text-lg font-semibold">Workspace</span>
        </div>
        <p className="text-xs text-neutral-400">
          Manage documents stored in Prisma-backed workspace.
        </p>
      </div>

      <Button
        onClick={handleCreate}
        disabled={isCreating}
        className="w-full bg-blue-600 text-white transition hover:bg-blue-500"
      >
        {isCreating ? "Creating…" : "New File"}
      </Button>

      <div className="mt-10 flex-1 overflow-y-auto pr-2">
        <h3 className="text-xs uppercase tracking-wider text-neutral-500">
          Recent files
        </h3>
        <ul className="mt-4 space-y-2 text-sm">
          {fileList.length === 0 && (
            <li className="rounded-md bg-neutral-900 p-3 text-neutral-400">
              No files yet. Create one to get started.
            </li>
          )}
          {fileList.map((file) => (
            <li key={file.id}>
              <Link
                href={`/workspace/${file.id}`}
                className="flex flex-col rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 transition hover:border-neutral-500 hover:bg-neutral-900"
              >
                <span className="font-medium text-white">{file.fileName}</span>
                <span className="text-xs text-neutral-400">
                  Updated {new Date(file.updatedAt).toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        {fileList.length} file{fileList.length === 1 ? "" : "s"} total
      </div>
    </aside>
  );
};

export default Sidebar;
