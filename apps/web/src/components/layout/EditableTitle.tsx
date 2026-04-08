"use client";

import { useEffect, useRef, useState } from "react";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EditableTitle({ value, onChange, className = "" }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") { setDraft(value); setIsEditing(false); }
        }}
        className={`bg-transparent border border-primary/30 rounded px-1.5 py-0.5 outline-none focus:border-primary ${className}`}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setIsEditing(true); }}
      className={`hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors cursor-text text-left ${className}`}
      title="Clique para editar"
    >
      {value}
    </button>
  );
}
