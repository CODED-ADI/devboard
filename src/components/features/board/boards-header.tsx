"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateBoardModal } from "@/components/features/board/create-board-modal";

interface BoardsHeaderProps {
  boardCount: number;
  workspaceName: string;
  workspaceId: string;
}

export function BoardsHeader({ boardCount, workspaceName, workspaceId }: BoardsHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Boards</h1>
          <p className="mt-1 text-sm text-slate-400">
            {boardCount} board{boardCount !== 1 ? "s" : ""} in {workspaceName}
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="gap-2 bg-indigo-500 hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>

      <CreateBoardModal
        open={open}
        onClose={() => setOpen(false)}
        workspaceId={workspaceId}
      />
    </>
  );
}
