import { create } from "zustand";

export type GenerationType =
  | "audio"
  | "slides"
  | "video"
  | "mindmap"
  | "report"
  | "studycards"
  | "quiz"
  | "infographic"
  | "datatable";

export type GenerationStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface GenerationStep {
  name: string;
  status: "pending" | "active" | "completed" | "failed";
}

export interface GenerationJob {
  id: string;
  type: GenerationType;
  status: GenerationStatus;
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  estimatedTimeRemaining?: string;
  sourceCount: number;
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface GenerationStore {
  jobs: GenerationJob[];
  addJob: (job: GenerationJob) => void;
  updateJob: (id: string, updates: Partial<GenerationJob>) => void;
  removeJob: (id: string) => void;
  getActiveJobs: () => GenerationJob[];
  getCompletedJobs: () => GenerationJob[];
}

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  jobs: [],

  addJob: (job) =>
    set((state) => ({ jobs: [job, ...state.jobs] })),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      ),
    })),

  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    })),

  getActiveJobs: () =>
    get().jobs.filter(
      (job) => job.status === "queued" || job.status === "processing"
    ),

  getCompletedJobs: () =>
    get().jobs.filter(
      (job) => job.status === "completed" || job.status === "failed"
    ),
}));
