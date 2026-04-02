import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../api/client";
import type { ManagedUser } from "../types";

type UserForm = {
  name: string;
  username: string;
  password: string;
  role: number;
};

const emptyForm: UserForm = { name: "", username: "", password: "", role: 0 };

export function UserPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<ManagedUser[]>("/api/users"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        username: form.username.trim(),
        role: form.role,
      };
      if (!payload.name || !payload.username) {
        throw new Error("Name and username are required.");
      }

      if (editing) {
        if (form.password.trim()) payload.password = form.password.trim();
        await apiPut<ManagedUser>(`/api/users/${editing.id}`, payload);
      } else {
        await apiPost<ManagedUser>("/api/users", payload);
      }
    },
    onSuccess: async () => {
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(user: ManagedUser) {
    setEditing(user);
    setForm({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleDelete(user: ManagedUser) {
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    try {
      await apiDelete(`/api/users/${user.id}`);
      await qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  async function handleResetPassword(user: ManagedUser) {
    if (
      !window.confirm(
        `Reset password for "${user.username}" to the default (123456789)?`,
      )
    ) {
      return;
    }
    try {
      await apiPost<{ ok: boolean }>(`/api/users/${user.id}/reset-password`, {});
      window.alert("Password reset.");
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  if (usersQuery.isLoading) return <p className="muted">Loading users...</p>;
  if (usersQuery.isError) {
    return <p className="error">{(usersQuery.error as Error).message}</p>;
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Users</h1>
        <button
          type="button"
          className="btn primary icon-only"
          onClick={openCreate}
          aria-label="Add user"
          title="Add user"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>{u.role === 1 ? "Admin" : "User"}</td>
                <td className="actions">
                  <button
                    className="btn link icon-only"
                    aria-label="Edit user"
                    title="Edit"
                    onClick={() => openEdit(u)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn link icon-only"
                    aria-label="Reset password to default"
                    title="Reset password (123456789)"
                    onClick={() => void handleResetPassword(u)}
                  >
                    <KeyRound size={15} />
                  </button>
                  <button
                    className="btn link danger icon-only"
                    aria-label="Delete user"
                    title="Delete"
                    onClick={() => void handleDelete(u)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="muted pad">No users yet.</p>}
      </div>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editing ? "Edit user" : "New user"}</h2>
            {formError && <p className="error small">{formError}</p>}
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Username
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </label>
              {editing ? (
                <label>
                  Password (leave blank to keep existing)
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </label>
              ) : (
                <p className="muted small">
                  New users get default password: <strong>123456789</strong>
                </p>
              )}
              <label>
                Role
                <select
                  value={String(form.role)}
                  onChange={(e) => setForm({ ...form, role: Number(e.target.value) })}
                >
                  <option value="0">User</option>
                  <option value="1">Admin</option>
                </select>
              </label>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
