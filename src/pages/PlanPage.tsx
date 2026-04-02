import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../api/client";
import { getStoredUser } from "../auth";
import type { ManagedUser, Plan } from "../types";

type PlanForm = {
  userId: string;
  date: string;
  english: string;
  spanish: string;
  japanese: string;
  note: string;
};

const emptyForm: PlanForm = {
  userId: "",
  date: "",
  english: "0",
  spanish: "0",
  japanese: "0",
  note: "",
};

export function PlanPage() {
  const qc = useQueryClient();
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 1;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterCompleted, setFilterCompleted] = useState<"all" | "yes" | "no">("all");

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGet<Plan[]>("/api/plans"),
  });

  const usersQuery = useQuery({
    queryKey: ["users", "for-plan"],
    queryFn: () => apiGet<ManagedUser[]>("/api/users"),
    enabled: isAdmin,
  });

  const plans = plansQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (filterDate && p.date.slice(0, 10) !== filterDate) return false;
      if (filterCompleted === "yes" && !p.completed) return false;
      if (filterCompleted === "no" && p.completed) return false;
      return true;
    });
  }, [plans, filterDate, filterCompleted]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.date) throw new Error("Date is required.");
      const userId = Number(form.userId);
      const english = Number(form.english);
      const spanish = Number(form.spanish);
      const japanese = Number(form.japanese);

      if (form.userId && (!Number.isInteger(userId) || userId <= 0)) {
        throw new Error("User ID must be a positive number.");
      }
      if (!Number.isInteger(english)) throw new Error("English must be an integer.");
      if (!Number.isInteger(spanish)) throw new Error("Spanish must be an integer.");
      if (!Number.isInteger(japanese)) throw new Error("Japanese must be an integer.");

      const payload: Record<string, unknown> = {
        date: form.date,
        english,
        spanish,
        japanese,
        note: form.note.trim() || null,
      };
      if (form.userId.trim()) payload.userId = userId;

      if (editing) {
        await apiPut<Plan>(`/api/plans/${editing.id}`, payload);
      } else {
        await apiPost<Plan>("/api/plans", payload);
      }
    },
    onSuccess: async () => {
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm({
      userId: String(plan.userId),
      date: plan.date.slice(0, 10),
      english: String(plan.english),
      spanish: String(plan.spanish),
      japanese: String(plan.japanese),
      note: plan.note ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleDelete(plan: Plan) {
    if (!window.confirm(`Delete plan #${plan.id}?`)) return;
    try {
      await apiDelete(`/api/plans/${plan.id}`);
      await qc.invalidateQueries({ queryKey: ["plans"] });
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  if (plansQuery.isLoading) return <p className="muted">Loading plans...</p>;
  if (plansQuery.isError) return <p className="error">{(plansQuery.error as Error).message}</p>;
  if (usersQuery.isError) return <p className="error">{(usersQuery.error as Error).message}</p>;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Plans</h1>
        {isAdmin && (
          <button
            type="button"
            className="btn primary icon-only"
            onClick={openCreate}
            aria-label="Add plan"
            title="Add plan"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <div className="card filters plan-filters">
        <div className="filter-row">
          <label>
            Date
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </label>
          <label>
            Completed
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value as "all" | "yes" | "no")}
            >
              <option value="all">All</option>
              <option value="yes">Completed</option>
              <option value="no">Incomplete</option>
            </select>
          </label>
          <div className="filter-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setFilterDate("");
                setFilterCompleted("all");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>User</th>
              <th>Date</th>
              <th>English</th>
              <th>Spanish</th>
              <th>Japanese</th>
              <th>Completed</th>
              <th>Note</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.user?.username ?? `#${p.userId}`}</td>
                <td>{p.date.slice(0, 10)}</td>
                <td>{p.english}</td>
                <td>{p.spanish}</td>
                <td>{p.japanese}</td>
                <td>
                  {p.completed ? (
                    <CheckCircle2 size={18} className="plan-complete-icon" aria-label="Completed" />
                  ) : (
                    <XCircle size={18} className="plan-incomplete-icon" aria-label="Incomplete" />
                  )}
                </td>
                <td>{p.note || "—"}</td>
                {isAdmin && (
                  <td className="actions">
                    <button
                      type="button"
                      className="btn link icon-only"
                      aria-label="Edit plan"
                      title="Edit"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn link danger icon-only"
                      aria-label="Delete plan"
                      title="Delete"
                      onClick={() => void handleDelete(p)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPlans.length === 0 && <p className="muted pad">No plans yet.</p>}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setModalOpen(false)}>
          <div className="modal card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit plan" : "New plan"}</h2>
            {formError && <p className="error small">{formError}</p>}
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              {isAdmin && (
                <label>
                  User
                  <select
                    value={form.userId}
                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  >
                    <option value="">Use current user</option>
                    {users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.username} ({u.name})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </label>
              <label>
                English
                <input
                  type="number"
                  value={form.english}
                  onChange={(e) => setForm({ ...form, english: e.target.value })}
                  required
                />
              </label>
              <label>
                Spanish
                <input
                  type="number"
                  value={form.spanish}
                  onChange={(e) => setForm({ ...form, spanish: e.target.value })}
                  required
                />
              </label>
              <label>
                Japanese
                <input
                  type="number"
                  value={form.japanese}
                  onChange={(e) => setForm({ ...form, japanese: e.target.value })}
                  required
                />
              </label>
              <label>
                Note
                <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
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
