"use client";

import { Copy, Globe, Link, Lock, Users } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type AccessLevel = "restricted" | "anyone_with_link";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookName: string;
  ownerName: string;
  ownerEmail: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  notebookName,
  ownerName,
  ownerEmail,
}: ShareDialogProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("restricted");
  const [notifyPeople, setNotifyPeople] = useState(true);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2Icon className="h-5 w-5 text-muted-foreground" />
            Partilhe &quot;{notebookName}&quot;
          </DialogTitle>
        </DialogHeader>

        {/* Invite input */}
        <div>
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Adicionar pessoas e grupos"
            className="text-sm"
          />
        </div>

        {/* People with access */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Pessoas com acesso</span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Notificar pessoas
              <input
                type="checkbox"
                checked={notifyPeople}
                onChange={(e) => setNotifyPeople(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-green-600 text-white text-sm">
                {ownerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{ownerName}</p>
              <p className="text-xs text-muted-foreground truncate">{ownerEmail}</p>
            </div>
            <span className="text-xs text-muted-foreground">Proprietário</span>
          </div>
        </div>

        <Separator />

        {/* Welcome note toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nota de boas-vindas</p>
              <p className="text-xs text-muted-foreground">
                Adicione uma nota para os utilizadores quando abrem o notebook
              </p>
            </div>
          </div>
          <button
            className="h-6 w-11 rounded-full bg-muted transition-colors data-[active=true]:bg-primary"
            data-active={false}
          >
            <span className="block h-5 w-5 rounded-full bg-background shadow translate-x-0.5 transition-transform data-[active=true]:translate-x-5" />
          </button>
        </div>

        <Separator />

        {/* Access level */}
        <div>
          <p className="text-sm font-medium mb-2">Acesso ao notebook</p>
          <button
            onClick={() =>
              setAccessLevel(
                accessLevel === "restricted" ? "anyone_with_link" : "restricted"
              )
            }
            className="flex items-center gap-3 w-full rounded-md p-2 hover:bg-muted/50 transition-colors"
          >
            {accessLevel === "restricted" ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Users className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="text-left">
              <p className="text-sm">
                {accessLevel === "restricted" ? "Restrito" : "Qualquer pessoa com o link"}
              </p>
              <p className="text-xs text-muted-foreground">
                {accessLevel === "restricted"
                  ? "Apenas as pessoas com acesso podem abrir com o link"
                  : "Qualquer pessoa com o link pode ver"}
              </p>
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyLink}>
            <Link className="h-4 w-4" /> Copiar link
          </Button>
          <div className="flex-1" />
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Share2Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}
