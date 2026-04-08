"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Wifi,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WS_LIVE_URL } from "@/lib/api";

/*
 * LiveAssistant — Assistente interactivo por voz, vídeo e screenshare.
 *
 * Routing: Ollama (offline) → Gemini 3.1 Flash Live (online) → Gemini text (fallback)
 *
 * Arquitectura:
 * - Microfone: Web Audio API → PCM 16-bit 16kHz → base64 → WebSocket
 * - Playback: base64 → PCM 24kHz → AudioBuffer → AudioContext.play()
 * - Vídeo/Screen: getUserMedia/getDisplayMedia → Canvas JPEG @ 1fps → WebSocket
 * - Backend: FastAPI WebSocket → Provider routing → Gemini Live / Ollama / text
 */

type AssistantMode = "voice" | "video" | "screenshare";
type ProviderType = "gemini-live" | "ollama" | "gemini-text" | null;

interface LiveAssistantProps {
  notebookId: string;
  sourceCount: number;
}

const PROVIDER_LABELS: Record<string, string> = {
  "gemini-live": "Gemini 3.1 Flash Live",
  ollama: "Ollama (offline)",
  "gemini-text": "Gemini (texto)",
};

// ── Voice Visualizer ────────────────────────────────────────────────────

function VoiceVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-primary"
          animate={
            isActive
              ? { height: [8, 24 + Math.random() * 24, 8] }
              : { height: 8 }
          }
          transition={
            isActive
              ? { duration: 0.5 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.1 }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ── Audio Helpers ────────────────────────────────────────────────────────

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x7fff;
  }
  return float32;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Main Component ──────────────────────────────────────────────────────

export function LiveAssistant({ notebookId, sourceCount }: LiveAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>("voice");
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [provider, setProvider] = useState<ProviderType>(null);
  const [transcript, setTranscript] = useState("");

  // Refs for media and WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);

  // ── Cleanup ──

  const cleanup = useCallback(() => {
    // Stop audio capture
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Stop video/screen capture
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "stop" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsScreenSharing(false);
    setProvider(null);
    setTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // ── Play audio response ──

  const playAudio = useCallback(async (pcmBase64: string) => {
    try {
      if (!playbackContextRef.current) {
        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = playbackContextRef.current;
      const buffer = base64ToArrayBuffer(pcmBase64);
      const int16 = new Int16Array(buffer);
      const float32 = int16ToFloat32(int16);

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, []);

  // ── Start audio capture ──

  const startAudioCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(float32);
        const b64 = arrayBufferToBase64(int16.buffer);

        wsRef.current.send(JSON.stringify({ type: "audio", data: b64 }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (e) {
      console.error("Microphone access error:", e);
    }
  }, [isMuted]);

  // ── Start video/screen capture ──

  const startFrameCapture = useCallback(async (captureMode: "video" | "screenshare") => {
    try {
      const stream =
        captureMode === "video"
          ? await navigator.mediaDevices.getUserMedia({ video: { width: 768, height: 768 } })
          : await navigator.mediaDevices.getDisplayMedia({ video: true });

      videoStreamRef.current = stream;
      if (captureMode === "screenshare") setIsScreenSharing(true);

      // Create canvas for frame extraction
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 768;
      const ctx2d = canvas.getContext("2d")!;

      // Capture 1 frame per second
      frameIntervalRef.current = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        ctx2d.drawImage(video, 0, 0, 768, 768);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const b64 = dataUrl.split(",")[1];

        wsRef.current.send(JSON.stringify({ type: "frame", data: b64 }));
      }, 1000);

      // Handle stream end (user clicks "Stop sharing")
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
          }
          setIsScreenSharing(false);
        };
      });
    } catch (e) {
      console.error("Capture error:", e);
    }
  }, []);

  // ── Connect ──

  const handleConnect = useCallback(async () => {
    const ws = new WebSocket(`${WS_LIVE_URL}/${notebookId}/session`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "start", mode }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "status":
            if (msg.status === "connected") {
              setIsConnected(true);
              setProvider(msg.provider);
              // Start audio capture for voice and video modes
              if (mode === "voice" || mode === "video") {
                startAudioCapture();
              }
              // Start video capture
              if (mode === "video" || mode === "screenshare") {
                startFrameCapture(mode);
              }
            } else if (msg.status === "disconnected") {
              cleanup();
            }
            break;

          case "audio":
            if (msg.data) playAudio(msg.data);
            break;

          case "text":
            if (msg.content) {
              setTranscript((prev) => prev + msg.content);
            }
            break;

          case "turn_complete":
            setTranscript((prev) => prev + "\n\n");
            break;

          case "error":
            console.error("Live error:", msg.error);
            break;
        }
      } catch (e) {
        console.error("Message parse error:", e);
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };
  }, [notebookId, mode, startAudioCapture, startFrameCapture, playAudio, cleanup]);

  // ── Disconnect ──

  const handleDisconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // ── Toggle mute (update processor callback) ──

  useEffect(() => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = (e) => {
        if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = float32ToInt16(float32);
        const b64 = arrayBufferToBase64(int16.buffer);
        wsRef.current.send(JSON.stringify({ type: "audio", data: b64 }));
      };
    }
  }, [isMuted]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2" variant="outline" size="sm">
        <Wand2 className="h-4 w-4" />
        Assistente ao Vivo
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) cleanup(); setIsOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              Assistente ao Vivo
              {isConnected && provider && (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  {PROVIDER_LABELS[provider] || provider}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Mode selector */}
          <div className="flex gap-2">
            {([
              { mode: "voice" as const, icon: Mic, label: "Voz" },
              { mode: "video" as const, icon: Video, label: "Vídeo" },
              { mode: "screenshare" as const, icon: Monitor, label: "Partilha de ecrã" },
            ]).map(({ mode: m, icon: Icon, label }) => (
              <button
                key={m}
                onClick={() => !isConnected && setMode(m)}
                disabled={isConnected}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  mode === m
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border/50 hover:bg-muted/50"
                } ${isConnected ? "opacity-60 cursor-not-allowed" : ""}`}
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
                    {mode === "screenshare" && <Monitor className="h-7 w-7 text-muted-foreground" />}
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
                  <VoiceVisualizer isActive={isConnected && !isMuted} />

                  {/* Live transcript */}
                  {transcript && (
                    <div className="max-h-24 overflow-y-auto rounded-md bg-background/50 p-2 text-xs text-muted-foreground leading-relaxed">
                      {transcript}
                    </div>
                  )}

                  <p className="text-center text-sm text-muted-foreground">
                    {isMuted ? "Microfone desligado" : "A ouvir... Fale sobre as suas fontes"}
                  </p>

                  {/* Provider badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {provider === "ollama" ? (
                        <WifiOff className="h-3 w-3" />
                      ) : (
                        <Wifi className="h-3 w-3" />
                      )}
                      {PROVIDER_LABELS[provider || ""] || "A conectar..."}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>

                    {mode === "video" && (
                      <Button
                        variant={isVideoOn ? "outline" : "secondary"}
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setIsVideoOn(!isVideoOn)}
                      >
                        {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                    )}

                    {mode === "screenshare" && !isScreenSharing && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => startFrameCapture("screenshare")}
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
            Routing: Ollama (offline) → Gemini 3.1 Flash Live (online) → Gemini (fallback) · Latência &lt;320ms · 90+ idiomas
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
