import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Píchačky",
  description: "Evidence odpracovaného času a tasků",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="cs">
      <body>
        {user && (
          <nav>
            <span className="font-bold">Píchačky</span>
            <Link href="/">Dashboard</Link>
            <Link href="/tasks">Tasky</Link>
            <Link href="/history">Historie</Link>
            <Link href="/stats">Statistiky</Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-gray-500">
                Odhlásit
              </button>
            </form>
          </nav>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
