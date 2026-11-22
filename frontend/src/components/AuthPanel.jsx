import { useState } from "react";
import { authRequest } from "../auth/api";

export default function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      if (mode === "register") {
        await authRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      }

      await authRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const user = await authRequest("/api/auth/me");
      onAuthenticated(user);
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="text-xl font-bold">
        {mode === "login" ? "Sign in" : "Create account"}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Sign in to securely track your scholarship applications.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <input
          type="email"
          aria-label="Email"
          placeholder="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border p-3"
        />

        <input
          type="password"
          aria-label="Password"
          placeholder="Password"
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border p-3"
        />

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
        className="mt-4 text-sm font-medium text-indigo-700"
      >
        {mode === "login"
          ? "New student? Create an account"
          : "Already registered? Sign in"}
      </button>
    </div>
  );
}
