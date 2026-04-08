"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ChatObjective = "default" | "learning" | "custom";
type ResponseSize = "default" | "longer" | "shorter";

interface ChatConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (config: { objective: ChatObjective; responseSize: ResponseSize }) => void;
}

function OptionButton({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:bg-muted/50"
      }`}
    >
      {selected && <span className="mr-1.5">✓</span>}
      {label}
    </button>
  );
}

export function ChatConfigDialog({ open, onOpenChange, onSave }: ChatConfigDialogProps) {
  const [objective, setObjective] = useState<ChatObjective>("default");
  const [responseSize, setResponseSize] = useState<ResponseSize>("default");

  const handleSave = () => {
    onSave?.({ objective, responseSize });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure o chat</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Os notebooks podem ser personalizados para ajudar a alcançar diferentes
          objetivos: investigar, ajudar a aprender, mostrar várias perspetivas ou
          conversar num estilo e tom específicos.
        </p>

        {/* Objective */}
        <div>
          <p className="text-sm font-medium mb-3">
            Defina o seu objetivo, estilo ou função de conversação
          </p>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="Predefinição"
              selected={objective === "default"}
              onClick={() => setObjective("default")}
            />
            <OptionButton
              label="Guia de aprendizagem"
              selected={objective === "learning"}
              onClick={() => setObjective("learning")}
            />
            <OptionButton
              label="Personalizado"
              selected={objective === "custom"}
              onClick={() => setObjective("custom")}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {objective === "default" &&
              "Melhor para tarefas gerais de investigação e debate de ideias."}
            {objective === "learning" &&
              "Explica conceitos passo a passo, faz perguntas para verificar compreensão."}
            {objective === "custom" &&
              "Defina instruções personalizadas para o comportamento do chat."}
          </p>
        </div>

        {/* Response size */}
        <div>
          <p className="text-sm font-medium mb-3">
            Escolha a dimensão da sua resposta
          </p>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="Predefinição"
              selected={responseSize === "default"}
              onClick={() => setResponseSize("default")}
            />
            <OptionButton
              label="Maior"
              selected={responseSize === "longer"}
              onClick={() => setResponseSize("longer")}
            />
            <OptionButton
              label="Menor"
              selected={responseSize === "shorter"}
              onClick={() => setResponseSize("shorter")}
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
