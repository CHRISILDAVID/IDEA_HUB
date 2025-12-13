"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, Delete, MoreHorizontal } from "lucide-react";
import { FileListContext } from "@/app/_context/FileListContext";
import moment from "moment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import type { WorkspaceFile } from "../../workspace/_types";
import { toast } from "sonner";

const DashboardTable = () => {
  const context = useContext(FileListContext);
  if (!context) {
    throw new Error("DashboardTable must be used within FileListContext provider");
  }

  const { fileList, setFileList } = context;
  const [fileList_, setFileList_] = useState<WorkspaceFile[]>([]);

  useEffect(() => {
    setFileList_(fileList);
  }, [fileList]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete file");
      }
  setFileList(fileList.filter((file: WorkspaceFile) => file.id !== id));
      toast.success("File deleted");
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete file");
    }
  };

  const router = useRouter();

  return (
    <div className="mt-8 pl-2 pr-2">
      <Table className="border-none ">
        <TableHeader className="">
          <TableRow className="border-white/40 mx-16 hover:bg-transparent">
            <TableHead className="pl-20 w-[300px]">Name</TableHead>
            <TableHead className="">Location</TableHead>
            <TableHead className="">Author</TableHead>
            <TableHead className="pr-2 w-[100px]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fileList_ &&
            fileList_.map((file) => (
              <TableRow
                onClick={() => {
                  router.push(`/workspace/${file.id}`);
                }}
                key={file.id}
                className="mx-16 hover:bg-white/10 cursor-pointer border-neutral-700 hover:text-white"
              >
                <TableCell className="font-medium pl-20">
                  {file.name || file.fileName}
                </TableCell>
                <TableCell className=""></TableCell>
                <TableCell className="w-[150px] text-sm">
                  {moment(file.createdAt).format("DD MMM YYYY")}
                </TableCell>
                <TableCell className="pr-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="outline-none">
                      <div className="p-1 hover:bg-neutral-600 w-fit rounded-sm cursor-pointer">
                        <MoreHorizontal size={16} />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-800 gap-1 rounded-lg text-white border-neutral-700 w-48 ml-4 mt-2">
                      <DropdownMenuItem
                        className="cursor-pointer focus:bg-neutral-700 focus:text-white"
                        onClick={() => {
                          console.log("clicked");
                        }}
                      >
                        <Archive size={16} className="mr-2" />
                        Archive (coming soon)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer focus:bg-red-500 focus:text-white hover:bg-red-500 hover:text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(file.id);
                        }}
                      >
                        <Delete size={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DashboardTable;
