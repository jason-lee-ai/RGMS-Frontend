import { useState } from "react";
import { apiPut } from "../api/client";
import { getStoredUser, setSession } from "../auth";
import type { AuthResponse } from "../types";

export function ProfilePage() {
  const currentUser = getStoredUser();
  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }
    setSaving(true);
    try {
      const payload: { username: string; newPassword?: string } = {
        username: username.trim(),
      };
      if (newPassword.trim()) payload.newPassword = newPassword.trim();
      const data = await apiPut<AuthResponse>("/api/auth/profile", payload);
      setSession(data.token, data.user);
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <h1>Profile</h1>
      <div className="card">
        <form className="form" onSubmit={onSubmit}>
          {error && <p className="error small">{error}</p>}
          {success && <p className="success small">{success}</p>}
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            New password (optional)
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave empty to keep current password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
