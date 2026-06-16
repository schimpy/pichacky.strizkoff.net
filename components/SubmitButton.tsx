"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText ?? "…" : children}
    </button>
  );
}
