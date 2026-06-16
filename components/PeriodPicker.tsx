"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "7", label: "7 dní" },
  { value: "30", label: "30 dní" },
  { value: "90", label: "90 dní" },
  { value: "365", label: "Rok" },
  { value: "all", label: "Vše" },
];

export default function PeriodPicker() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("period") ?? "30";

  return (
    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          className="btn btn-sm"
          style={
            o.value === current
              ? { background: "var(--brand)", color: "#fff", border: "none" }
              : {}
          }
          onClick={() => {
            const p = new URLSearchParams(params.toString());
            p.set("period", o.value);
            router.push(`/stats?${p.toString()}`);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
