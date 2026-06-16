"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Přehled" },
  { href: "/history", label: "Historie" },
  { href: "/tasks", label: "Tasky" },
  { href: "/stats", label: "Statistiky" },
];

export default function NavBar({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          height: "3.5rem",
        }}
      >
        <Link
          href="/"
          style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}
        >
          ⏱ Píchačky
        </Link>
        <nav style={{ display: "flex", gap: "0.25rem", flex: 1 }}>
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: active ? "var(--brand)" : "var(--muted)",
                  background: active ? "var(--color-brand-50, #eef2ff)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <form action={signOut}>
          <button type="submit" className="btn btn-ghost btn-sm">
            Odhlásit
          </button>
        </form>
      </div>
    </header>
  );
}
