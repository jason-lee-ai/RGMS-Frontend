import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/client";
import { setSession } from "../auth";
import type { AuthResponse } from "../types";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<AuthResponse>("/api/auth/login", {
        username: username.trim(),
        password,
      });
      setSession(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card form login-card" onSubmit={onSubmit}>
        <h1>Login</h1>
        <p className="muted">Use your account to access RealGuy Management.</p>
        {error && <p className="error small">{error}</p>}
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
