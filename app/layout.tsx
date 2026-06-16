import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import NavBar from "@/components/NavBar";

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
        {user && <NavBar signOut={signOut} />}
        <main
          style={{
            maxWidth: user ? "72rem" : "none",
            margin: "0 auto",
            padding: user ? "2rem 1.5rem" : "0",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
