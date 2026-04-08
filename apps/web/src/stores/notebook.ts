import { create } from "zustand";

export interface Notebook {
  id: string;
  name: string;
  description?: string;
  sourceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface NotebookStore {
  notebooks: Notebook[];
  currentNotebook: Notebook | null;
  setNotebooks: (notebooks: Notebook[]) => void;
  setCurrentNotebook: (notebook: Notebook | null) => void;
}

export const useNotebookStore = create<NotebookStore>((set) => ({
  notebooks: [],
  currentNotebook: null,
  setNotebooks: (notebooks) => set({ notebooks }),
  setCurrentNotebook: (notebook) => set({ currentNotebook: notebook }),
}));
