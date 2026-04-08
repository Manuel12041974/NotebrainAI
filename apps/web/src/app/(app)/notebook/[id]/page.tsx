"use client";

import { Settings2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Group, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";

import { ChatConfigDialog } from "@/components/chat/ChatConfigDialog";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { EditableTitle } from "@/components/layout/EditableTitle";
import { ShareDialog } from "@/components/layout/ShareDialog";
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
    setSources([
      { id: "1", type: "pdf", filename: "Relatório do Deep Research: Regime ...", status: "ready", selected: true, summary: "Relatório gerado pelo Deep Research sobre o regime de penalizações por não assinar o termo de aceitação do projeto Test Bed. Inclui análise de 2 fontes web." },
      { id: "2", type: "pdf", filename: "501467939_Proj8090_Dezembro_2025.pdf", status: "ready", selected: true, summary: "Relatório de progresso do projeto 8090 referente a Dezembro 2025. A iniciativa atingiu 45% de execução, contando com 27 projetos-piloto focados em proteger a propriedade intelectual de pequenas empresas." },
      { id: "3", type: "pdf", filename: "Adiantamento Test Bed.pdf", status: "ready", selected: true, summary: "Pedido de adiantamento para o projeto Test Bed DevSecPaaS. Documenta o processo de solicitação de fundos antecipados." },
      { id: "4", type: "pdf", filename: "Anexo-condicionantes-8090.pdf", status: "ready", selected: true, summary: "Este documento estabelece as condições obrigatórias que a empresa EXPANDINDUSTRIA e os seus parceiros devem cumprir para viabilizar o financiamento do projeto tecnológico DevSecPaaS." },
      { id: "5", type: "pdf", filename: "Análise candidatura 8090 Test Bed.pdf", status: "ready", selected: true, summary: "Análise detalhada da candidatura ao projeto 8090 Test Bed, incluindo critérios de avaliação, pontuação e recomendações." },
      { id: "6", type: "pdf", filename: "Decisao Final Test Bed.pdf", status: "ready", selected: true, summary: "Decisão final sobre a candidatura ao Test Bed, incluindo aprovação e condições específicas do financiamento." },
      { id: "7", type: "pdf", filename: "Estrutura-do-template-de-Declaracao.pdf", status: "ready", selected: true, summary: "Template oficial para a declaração de despesas e progresso do projeto, com instruções de preenchimento." },
      { id: "8", type: "pdf", filename: "FAQs_TestBeds_V06.pdf", status: "ready", selected: true, summary: "Perguntas frequentes sobre os Test Beds, versão 6. Cobre elegibilidade, prazos, relatórios e obrigações dos beneficiários." },
    ]);

    addJob({
      id: "gen-audio-1",
      type: "audio",
      status: "completed",
      progress: 100,
      currentStep: 4,
      totalSteps: 4,
      stepDescription: "Completo",
      sourceCount: 19,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });
    addJob({
      id: "gen-audio-2",
      type: "audio",
      status: "completed",
      progress: 100,
      currentStep: 4,
      totalSteps: 4,
      stepDescription: "Completo",
      sourceCount: 19,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });
    addJob({
      id: "gen-report-1",
      type: "report",
      status: "completed",
      progress: 100,
      currentStep: 3,
      totalSteps: 3,
      stepDescription: "Completo",
      sourceCount: 19,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });

    setResearchJob(null); // No research in progress for this demo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function NotebookWorkspace() {
  useDemoData();

  const [notebookName, setNotebookName] = useState("DevSecPaaS Test Bed Project 8090");
  const [shareOpen, setShareOpen] = useState(false);
  const [chatConfigOpen, setChatConfigOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-bold text-primary">N</span>
          </div>
          <EditableTitle
            value={notebookName}
            onChange={setNotebookName}
            className="text-sm font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            + Criar notebook
          </button>
          <button className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            Estatísticas
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> Partilhar
          </button>
          <LiveAssistant notebookId="1" sourceCount={22} />
          <button className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            Definições
          </button>
        </div>
      </header>

      {/* Main 3-panel workspace with resizable panels */}
      <Group
        orientation="horizontal"
        defaultLayout={[18, 52, 30]}
        className="flex-1"
      >
        {/* Left: Sources Panel */}
        <Panel min={12} max={35} className="overflow-hidden">
          <SourcePanel />
        </Panel>

        <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/20 active:bg-primary/40 transition-colors" />

        {/* Center: Chat Panel */}
        <Panel min={30} className="overflow-hidden">
          <ChatPanel
            notebookName={notebookName}
            sourceCount={22}
            onOpenConfig={() => setChatConfigOpen(true)}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/20 active:bg-primary/40 transition-colors" />

        {/* Right: Studio Panel */}
        <Panel min={15} max={40} className="overflow-hidden">
          <StudioPanel />
        </Panel>
      </Group>

      {/* Dialogs */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        notebookName={notebookName}
        ownerName="Manuel Oliveira"
        ownerEmail="manuellaurindooliveira@gmail.com"
      />
      <ChatConfigDialog
        open={chatConfigOpen}
        onOpenChange={setChatConfigOpen}
      />
    </div>
  );
}
