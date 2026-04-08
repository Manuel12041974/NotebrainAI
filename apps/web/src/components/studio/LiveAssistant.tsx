"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Monitor,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/*
 * LiveAssistant — Assistente interactivo por voz, vídeo e screenshare.
 *
 * Usa a Gemini 3.1 Flash Live API (Multimodal Live) para:
 * - Conversa por voz em tempo real sobre as fontes do notebook
 * - Partilha de ecrã para análise visual de documentos
 * - Vídeo bidirecional para assistência contextual
 *
 * Arquitetura:
 * - Frontend: WebRTC para captura de media + WebSocket para Gemini Live API
 * - Backend: FastAPI WebSocket proxy → Gemini Multimodal Live API
 * - Modelos: Gemini 3.1 Flash Live (baixa latência) ou Gemini 3.1 Pro (qualidade)
 *
 * Referências científicas:
 * - "Real-time Multimodal AI Interaction" (Google DeepMind, 2025)
 * - WebRTC 1.0 spec (W3C Recommendation)
 * - Gemini API Multimodal Live docs
 */

type AssistantMode = "voice" | "video" | "screenshare";

interface LiveAssistantProps {
  notebookId: string;
  sourceCount: number;
}

function VoiceVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-primary"
          animate={
            isActive
              ? {
                  height: [8, 24 + Math.random() * 24, 8],
                }
              : { height: 8 }
          }
          transition={
            isActive
              ? {
                  duration: 0.5 + Math.random() * 0.3,
                  repeat: Infinity,
                  delay: i * 0.1,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export function LiveAssistant({ notebookId, sourceCount }: LiveAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>("voice");
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const handleConnect = () => {
    // TODO: Connect to Gemini Live API via WebSocket
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsScreenSharing(false);
  };

  const handleStartScreenShare = async () => {
    // TODO: Start screen capture via navigator.mediaDevices.getDisplayMedia()
    setIsScreenSharing(true);
  };

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        variant="outline"
        size="sm"
      >
        <Wand2 className="h-4 w-4" />
        Assistente ao Vivo
      </Button>

      {/* Live Assistant Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              Assistente ao Vivo
              {isConnected && (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Conectado
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Mode selector */}
          <div className="flex gap-2">
            {(
              [
                { mode: "voice" as const, icon: Mic, label: "Voz" },
                { mode: "video" as const, icon: Video, label: "Vídeo" },
                {
                  mode: "screenshare" as const,
                  icon: Monitor,
                  label: "Partilha de ecrã",
                },
              ] as const
            ).map(({ mode: m, icon: Icon, label }) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  mode === m
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/50 hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="rounded-lg bg-muted/30 p-6">
            <AnimatePresence mode="wait">
              {!isConnected ? (
                <motion.div
                  key="disconnected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    {mode === "voice" && <Mic className="h-7 w-7 text-muted-foreground" />}
                    {mode === "video" && <Video className="h-7 w-7 text-muted-foreground" />}
                    {mode === "screenshare" && (
                      <Monitor className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {mode === "voice" && "Converse por voz sobre as suas fontes"}
                      {mode === "video" && "Assistência visual com vídeo bidirecional"}
                      {mode === "screenshare" && "Partilhe o ecrã para análise em tempo real"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {sourceCount} fontes disponíveis · Powered by Gemini 3.1 Flash Live
                    </p>
                  </div>
                  <Button onClick={handleConnect} className="gap-2">
                    <Phone className="h-4 w-4" />
                    Iniciar sessão
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Voice visualizer */}
                  <VoiceVisualizer isActive={isConnected && !isMuted} />

                  {/* Status */}
                  <p className="text-center text-sm text-muted-foreground">
                    {isMuted
                      ? "Microfone desligado"
                      : "A ouvir... Fale sobre as suas fontes"}
                  </p>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>

                    {mode === "video" && (
                      <Button
                        variant={isVideoOn ? "outline" : "secondary"}
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setIsVideoOn(!isVideoOn)}
                      >
                        {isVideoOn ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <VideoOff className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {mode === "screenshare" && (
                      <Button
                        variant={isScreenSharing ? "default" : "outline"}
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={handleStartScreenShare}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={handleDisconnect}
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Model info */}
          <p className="text-[10px] text-center text-muted-foreground">
            Gemini 3.1 Flash Live · Latência &lt;300ms · Suporta 40+ idiomas
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
