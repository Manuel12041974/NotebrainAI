"use client";

import { Download, MoreVertical, Pencil, Share2, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudioItemMenuProps {
  itemId: string;
  onRename?: (id: string) => void;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function StudioItemMenu({
  itemId,
  onRename,
  onDownload,
  onShare,
  onDelete,
}: StudioItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted cursor-pointer">
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onRename?.(itemId)} className="gap-2">
          <Pencil className="h-4 w-4" /> Mudar o nome
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload?.(itemId)} className="gap-2">
          <Download className="h-4 w-4" /> Transferir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onShare?.(itemId)} className="gap-2">
          <Share2 className="h-4 w-4" /> Partilhar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete?.(itemId)}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
