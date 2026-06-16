import { signIn } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div className="card card-pad" style={{ width: "100%", maxWidth: "22rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "1.75rem" }}>⏱</div>
          <h1 style={{ fontSize: "1.4rem", marginTop: "0.25rem" }}>Píchačky</h1>
          <p className="muted" style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
            Přihlas se ke svému účtu
          </p>
        </div>
        <form action={signIn} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input" autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Heslo
            </label>
            <input id="password" name="password" type="password" required className="input" />
          </div>
          {error && (
            <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: 0 }}>{error}</p>
          )}
          <SubmitButton className="btn btn-primary btn-lg" pendingText="Přihlašuji…">
            Přihlásit se
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
