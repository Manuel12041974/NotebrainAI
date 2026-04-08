import { create } from "zustand";

export interface Source {
  id: string;
  type: "pdf" | "docx" | "url" | "youtube" | "text" | "image" | "audio";
  filename?: string;
  url?: string;
  status: "processing" | "ready" | "error";
  metadata?: Record<string, unknown>;
  selected: boolean;
  summary?: string; // AI-generated guide/summary
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
  expandedSourceId: string | null;
  researchJob: ResearchJob | null;
  setSources: (sources: Source[]) => void;
  addSource: (source: Source) => void;
  removeSource: (id: string) => void;
  renameSource: (id: string, newName: string) => void;
  reorderSources: (sourceIds: string[]) => void;
  toggleSource: (id: string) => void;
  toggleSelectAll: () => void;
  setExpandedSource: (id: string | null) => void;
  setResearchJob: (job: ResearchJob | null) => void;
  updateResearchJob: (updates: Partial<ResearchJob>) => void;
}

export const useSourcesStore = create<SourcesStore>((set, get) => ({
  sources: [],
  selectAll: true,
  expandedSourceId: null,
  researchJob: null,

  setSources: (sources) => set({ sources }),

  addSource: (source) =>
    set((state) => ({ sources: [...state.sources, source] })),

  removeSource: (id) =>
    set((state) => ({
      sources: state.sources.filter((s) => s.id !== id),
      expandedSourceId: state.expandedSourceId === id ? null : state.expandedSourceId,
    })),

  renameSource: (id, newName) =>
    set((state) => ({
      sources: state.sources.map((s) =>
        s.id === id ? { ...s, filename: newName } : s
      ),
    })),

  reorderSources: (sourceIds) =>
    set((state) => {
      const map = new Map(state.sources.map((s) => [s.id, s]));
      return { sources: sourceIds.map((id) => map.get(id)!).filter(Boolean) };
    }),

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

  setExpandedSource: (id) =>
    set((state) => ({
      expandedSourceId: state.expandedSourceId === id ? null : id,
    })),

  setResearchJob: (job) => set({ researchJob: job }),

  updateResearchJob: (updates) =>
    set((state) => ({
      researchJob: state.researchJob
        ? { ...state.researchJob, ...updates }
        : null,
    })),
}));
