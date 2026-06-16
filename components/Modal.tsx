"use client";

import { useEffect, useRef, ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  // close on backdrop click
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose();
  };

  return (
    <dialog ref={ref} onClose={onClose} onClick={handleClick}>
      <div style={{ padding: "1.25rem", minWidth: "20rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", margin: 0 }}>{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "0.2rem 0.5rem" }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
