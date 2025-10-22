"use client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Archive,
  Github,
  Info,
  LayoutDashboard,
  Link2,
  MoreHorizontal,
  Save,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import Image from "next/image";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const WorkSpaceHeader = ({
  Tabs,
  setActiveTab,
  activeTab,
  savingState,
  file,
  readonly = false,
}: any) => {
  return (
    <div className="border-b  border-neutral-800 h-12 flex items-center px-4 w-full">
      {/* file name portion */}
      <div className="flex space-x-2 items-center justify-start w-full">
        <div className="flex space-x-2 items-center">
          <Image
            src="/IDEAHUB.svg"
            alt="IDEAHUB"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-sm font-medium">
              {file ? file.name : "Untitled"}
              {readonly && <span className="ml-2 text-xs text-yellow-500">(Read-only)</span>}
            </h1>
          </div>
        </div>
        {!readonly && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-sm hover:bg-neutral-700 outline-none hover:text-white cursor-pointer p-1">
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-neutral-800 ml-8 text-white  border-neutral-600">
                <DropdownMenuItem className="cursor-pointer text-xs focus:bg-neutral-700 focus:text-white">
                  <Archive size={16} className="mr-2" />
                  Move to Archive
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* tabs */}
      <div>
        <div className="border border-neutral-600 rounded">
          <div className="flex w-full items-center">
            {
              // tabs
              Tabs.map((tab: any) => (
                <div
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={cn(
                    " cursor-pointer w-24 text-sm text-center hover:bg-neutral-700 px-2 py-1",
                    {
                      "bg-neutral-700 text-white": tab.name === activeTab,
                    },
                    {
                      "border-r border-neutral-500":
                        tab.name !== Tabs[Tabs.length - 1].name,
                    }
                  )}
                >
                  <h1 className="text-sm font-medium">{tab.name}</h1>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* right most */}
      <div className="w-full space-x-4  flex items-center  justify-end">
        {/* Saving indicator replaces manual Save button */}
        <div className="rounded-sm flex items-center text-xs text-neutral-300 min-w-[80px] justify-end">
          {savingState === "saving" && (
            <span className="flex items-center">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
              Saving…
            </span>
          )}
          {savingState === "saved" && (
            <span className="text-neutral-400">Saved</span>
          )}
          {savingState === "error" && (
            <span className="text-red-400">Save failed, retrying…</span>
          )}
          {!savingState && <span className="text-neutral-500">Idle</span>}
        </div>
        <div
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/workspace/${file.id}`
            );
            toast.success("Link Copied");
          }}
          className="rounded-sm flex text-sm items-center bg-blue-700 hover:bg-blue-800 hover:text-white cursor-pointer px-2 py-1"
        >
          Share
          <Link2 size={16} className="ml-2" />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <div className="rounded-sm hover:bg-neutral-700 hover:text-white cursor-pointer p-1">
              <Info size={16} />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-neutral-800 text-white border-neutral-700">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h1 className="text-sm font-semibold">Info</h1>
                <p className="text-xs text-neutral-400">
                  This is a minimal workspace powered by Next.js + Prisma.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default WorkSpaceHeader;
