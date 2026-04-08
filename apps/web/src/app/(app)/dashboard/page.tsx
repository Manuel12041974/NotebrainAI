"use client";

import { Bookmark, MoreVertical, Plus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NotebookCard {
  id: string;
  name: string;
  sourceCount: number;
  updatedAt: string;
  icon?: string;
}

const demoNotebooks: NotebookCard[] = [
  {
    id: "1",
    name: "DevSecPaaS Test Bed Project 8090",
    sourceCount: 19,
    updatedAt: "07/04/2026",
    icon: "📋",
  },
  {
    id: "2",
    name: "Mastering Claude Code: 18 Advanced...",
    sourceCount: 15,
    updatedAt: "02/04/2026",
    icon: "✂️",
  },
  {
    id: "3",
    name: "Guia Completo de Aprendizado e...",
    sourceCount: 10,
    updatedAt: "02/04/2026",
    icon: "📄",
  },
];

function NotebookCardComponent({ notebook }: { notebook: NotebookCard }) {
  return (
    <Link
      href={`/notebook/${notebook.id}`}
      className="group relative flex flex-col rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
    >
      <button className="absolute right-3 top-3 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted">
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="mb-3 text-3xl">{notebook.icon || "📄"}</div>
      <h3 className="font-medium text-sm line-clamp-2">{notebook.name}</h3>
      <p className="mt-2 text-xs text-muted-foreground">
        {notebook.updatedAt} · {notebook.sourceCount} origens
      </p>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
              <Bookmark className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">NotebrainAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              Definições
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Search */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar notebooks..." className="pl-9" />
          </div>
        </div>

        {/* Recent notebooks */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Notebooks recentes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Create new */}
            <button className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 transition-all hover:border-primary/30 hover:bg-muted/40">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                Criar novo bloco de notas
              </span>
            </button>

            {/* Notebook cards */}
            {demoNotebooks.map((notebook) => (
              <NotebookCardComponent key={notebook.id} notebook={notebook} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
