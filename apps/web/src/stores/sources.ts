import { create } from "zustand";

export interface Source {
  id: string;
  type: "pdf" | "docx" | "url" | "youtube" | "text" | "image" | "audio";
  filename?: string;
  url?: string;
  status: "processing" | "ready" | "error";
  metadata?: Record<string, unknown>;
  selected: boolean;
}

export type ResearchMode = "quick" | "deep";

export interface ResearchJob {
  id: string;
  query: string;
  mode: ResearchMode;
  status: "planning" | "searching" | "analyzing" | "completed" | "failed";
  currentStep: number;
  totalSteps: number;
  steps: { name: string; status: "pending" | "active" | "completed" }[];
}

interface SourcesStore {
  sources: Source[];
  selectAll: boolean;
  researchJob: ResearchJob | null;
  setSources: (sources: Source[]) => void;
  toggleSource: (id: string) => void;
  toggleSelectAll: () => void;
  setResearchJob: (job: ResearchJob | null) => void;
  updateResearchJob: (updates: Partial<ResearchJob>) => void;
}

export const useSourcesStore = create<SourcesStore>((set, get) => ({
  sources: [],
  selectAll: true,
  researchJob: null,

  setSources: (sources) => set({ sources }),

  toggleSource: (id) =>
    set((state) => ({
      sources: state.sources.map((s) =>
        s.id === id ? { ...s, selected: !s.selected } : s
      ),
    })),

  toggleSelectAll: () =>
    set((state) => {
      const newSelectAll = !state.selectAll;
      return {
        selectAll: newSelectAll,
        sources: state.sources.map((s) => ({ ...s, selected: newSelectAll })),
      };
    }),

  setResearchJob: (job) => set({ researchJob: job }),

  updateResearchJob: (updates) =>
    set((state) => ({
      researchJob: state.researchJob
        ? { ...state.researchJob, ...updates }
        : null,
    })),
}));
