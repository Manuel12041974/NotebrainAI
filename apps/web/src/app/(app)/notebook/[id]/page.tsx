"use client";

import { useEffect } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { SourcePanel } from "@/components/sources/SourcePanel";
import { LiveAssistant } from "@/components/studio/LiveAssistant";
import { StudioPanel } from "@/components/studio/StudioPanel";
import { useGenerationStore } from "@/stores/generation";
import { useSourcesStore } from "@/stores/sources";

// Demo data to visualize the UI
function useDemoData() {
  const setSources = useSourcesStore((s) => s.setSources);
  const setResearchJob = useSourcesStore((s) => s.setResearchJob);
  const addJob = useGenerationStore((s) => s.addJob);

  useEffect(() => {
    // Demo sources
    setSources([
      { id: "1", type: "pdf", filename: "501467939_Proj8090_Dezembro_2025.pdf", status: "ready", selected: true },
      { id: "2", type: "pdf", filename: "Adiantamento Test Bed.pdf", status: "ready", selected: true },
      { id: "3", type: "pdf", filename: "Anexo-condicionantes-8090.pdf", status: "ready", selected: true },
      { id: "4", type: "pdf", filename: "Análise candidatura 8090 Test Bed.pdf", status: "ready", selected: true },
      { id: "5", type: "pdf", filename: "Decisao Final Test Bed.pdf", status: "ready", selected: true },
      { id: "6", type: "pdf", filename: "Estrutura-do-template-de-Declaracao.pdf", status: "ready", selected: true },
      { id: "7", type: "pdf", filename: "FAQs_TestBeds_V06.pdf", status: "ready", selected: true },
    ]);

    // Demo: active generation jobs with progress
    addJob({
      id: "gen-1",
      type: "audio",
      status: "processing",
      progress: 52,
      currentStep: 2,
      totalSteps: 4,
      stepDescription: "Gerando script do podcast",
      estimatedTimeRemaining: "3 min",
      sourceCount: 19,
      createdAt: new Date(),
    });
    addJob({
      id: "gen-2",
      type: "slides",
      status: "processing",
      progress: 87,
      currentStep: 4,
      totalSteps: 5,
      stepDescription: "Renderizando slides",
      estimatedTimeRemaining: "30s",
      sourceCount: 19,
      createdAt: new Date(),
    });
    addJob({
      id: "gen-3",
      type: "video",
      status: "processing",
      progress: 12,
      currentStep: 1,
      totalSteps: 6,
      stepDescription: "Analisando fontes",
      estimatedTimeRemaining: "8 min",
      sourceCount: 19,
      createdAt: new Date(),
    });

    // Demo: completed generations
    addJob({
      id: "gen-4",
      type: "report",
      status: "completed",
      progress: 100,
      currentStep: 3,
      totalSteps: 3,
      stepDescription: "Completo",
      sourceCount: 19,
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 60 * 1000),
    });

    // Demo: Deep Research in progress
    setResearchJob({
      id: "research-1",
      query: "penalizações por não assinar no novo termo de aceitação do projeto test bed",
      mode: "deep",
      status: "searching",
      currentStep: 2,
      totalSteps: 5,
      steps: [
        { name: "Planear investigação", status: "completed" },
        { name: "Pesquisar fontes web", status: "active" },
        { name: "Analisar resultados", status: "pending" },
        { name: "Cruzar com fontes locais", status: "pending" },
        { name: "Gerar relatório", status: "pending" },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function NotebookWorkspace() {
  useDemoData();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-bold text-primary">N</span>
          </div>
          <h1 className="text-sm font-semibold">
            DevSecPaaS Test Bed Project 8090
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + Criar notebook
          </button>
          <button className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            Estatísticas
          </button>
          <button className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            Partilhar
          </button>
          <LiveAssistant notebookId="1" sourceCount={19} />
          <button className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            Definições
          </button>
        </div>
      </header>

      {/* Main 3-panel workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sources Panel */}
        <aside className="w-[280px] shrink-0 border-r overflow-hidden">
          <SourcePanel />
        </aside>

        {/* Center: Chat Panel */}
        <main className="flex-1 overflow-hidden">
          <ChatPanel
            notebookName="DevSecPaaS Test Bed Project 8090"
            sourceCount={19}
          />
        </main>

        {/* Right: Studio Panel */}
        <aside className="w-[300px] shrink-0 border-l overflow-hidden">
          <StudioPanel />
        </aside>
      </div>
    </div>
  );
}
