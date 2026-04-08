"use client";

import { FileText, Globe, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadSource } from "@/lib/api";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  onUploaded: (source: { id: string; filename: string; status: string; chunk_count: number; summary: string }) => void;
}

export function UploadDialog({ open, onOpenChange, notebookId, onUploaded }: UploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const result = await uploadSource(notebookId, file);
        onUploaded({
          id: result.id,
          filename: result.filename || file.name,
          status: result.status,
          chunk_count: result.chunk_count,
          summary: result.summary || "",
        });
      } catch (err) {
        setError(`Erro ao fazer upload de ${file.name}`);
      }
    }

    setUploading(false);
    onOpenChange(false);
  }, [notebookId, onUploaded, onOpenChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar fontes</DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">A processar ficheiros...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Arraste ficheiros para aqui</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, MD, CSV</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => fileRef.current?.click()}
              >
                Escolher ficheiros
              </Button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md,.csv"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Supported formats */}
        <div className="flex flex-wrap gap-2">
          {["PDF", "DOCX", "TXT", "MD", "CSV"].map((fmt) => (
            <span key={fmt} className="flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" /> {fmt}
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
