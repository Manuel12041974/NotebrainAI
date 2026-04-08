"use client";

import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Headphones,
  Image,
  Loader2,
  Monitor,
  MoreVertical,
  Network,
  Pencil,
  Presentation,
  Share2,
  Table,
  Trash2,
  Trophy,
  Video,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { GenerationJob, GenerationType } from "@/stores/generation";

const typeConfig: Record<
  GenerationType,
  { label: string; icon: React.ElementType; color: string }
> = {
  audio: { label: "Resumo de áudio", icon: Headphones, color: "text-purple-500" },
  slides: { label: "Apresentação de slides", icon: Presentation, color: "text-blue-500" },
  video: { label: "Resumo de vídeo", icon: Video, color: "text-green-500" },
  mindmap: { label: "Mapa mental", icon: Network, color: "text-cyan-500" },
  report: { label: "Relatório", icon: FileText, color: "text-amber-500" },
  studycards: { label: "Cartões de estudo", icon: Trophy, color: "text-pink-500" },
  quiz: { label: "Questionário", icon: Monitor, color: "text-indigo-500" },
  infographic: { label: "Infografia", icon: Image, color: "text-rose-500" },
  datatable: { label: "Tabela de dados", icon: Table, color: "text-emerald-500" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Agora mesmo";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Há ${hours}h`;
}

interface GenerationCardProps {
  job: GenerationJob;
  onCancel?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function GenerationCard({ job, onCancel, onDownload }: GenerationCardProps) {
  const config = typeConfig[job.type];
  const Icon = config.icon;
  const isActive = job.status === "queued" || job.status === "processing";
  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-lg border p-3 transition-colors ${
        isActive
          ? "border-border/60 bg-muted/30"
          : isCompleted
            ? "border-border/40 hover:bg-muted/20 cursor-pointer"
            : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon with spinner for active jobs */}
        <div className="relative mt-0.5 shrink-0">
          {isActive ? (
            <div className="relative">
              <Loader2 className={`h-5 w-5 animate-spin ${config.color}`} />
            </div>
          ) : (
            <Icon
              className={`h-5 w-5 ${isCompleted ? config.color : "text-destructive"}`}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {isActive ? `A gerar ${config.label}...` : config.label}
            </span>
            {isFailed && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Erro
              </Badge>
            )}
          </div>

          {/* Progress bar and step info for active jobs */}
          {isActive && (
            <div className="mt-2 space-y-1.5">
              <Progress value={job.progress} className="h-1.5" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Passo {job.currentStep}/{job.totalSteps}: {job.stepDescription}
                </span>
                <span className="font-medium">{job.progress}%</span>
              </div>
              {job.estimatedTimeRemaining && (
                <p className="text-[11px] text-muted-foreground">
                  ⏱️ ~{job.estimatedTimeRemaining} restantes
                </p>
              )}
            </div>
          )}

          {/* Metadata for completed jobs */}
          {isCompleted && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {job.sourceCount} fontes · {timeAgo(job.completedAt || job.createdAt)}
            </p>
          )}

          {/* Error message */}
          {isFailed && job.error && (
            <p className="mt-1 text-[11px] text-destructive">{job.error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0">
          {isActive && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onCancel(job.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {isCompleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="gap-2 text-xs">
                  <Pencil className="h-3.5 w-3.5" /> Mudar o nome
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" /> Transferir
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs">
                  <Share2 className="h-3.5 w-3.5" /> Partilhar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-xs text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
}
