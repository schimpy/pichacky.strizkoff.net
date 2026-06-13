import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Píchačky</h1>
        <form action={signIn} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full border rounded px-3 py-2"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Heslo"
            className="w-full border rounded px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded bg-blue-600 text-white px-3 py-2"
          >
            Přihlásit
          </button>
        </form>
      </div>
    </div>
  );
}
