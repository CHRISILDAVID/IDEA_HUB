"use client";

import { FileListContext } from "@/app/_context/FileListContext";
import { useContext, useEffect } from "react";
import DashboardHeader from "./_components/DashboardHeader";
import DashboardTable from "./_components/DashboardTable";

const DashboardPage = () => {
  const context = useContext(FileListContext);

  if (!context) {
    throw new Error("DashboardPage must be used within FileListContext provider");
  }

  const { reloadFiles } = context;

  useEffect(() => {
    reloadFiles();
  }, [reloadFiles]);

  return (
    <div className="text-white">
      <DashboardHeader />
      <DashboardTable />
    </div>
  );
};

export default DashboardPage;
