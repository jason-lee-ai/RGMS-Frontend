import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../api/client";
import { COUNTRIES } from "../constants/countries";
import type { Site } from "../types";

type SiteForm = {
  name: string;
  country: string;
  language: string;
  url: string;
  forCaller: boolean;
  forAccount: boolean;
};

const emptyForm: SiteForm = {
  name: "",
  country: "",
  language: "",
  url: "",
  forCaller: false,
  forAccount: false,
};

const LANGUAGE_OPTIONS = ["Global", "English", "Spanish", "Japanese"] as const;

export function SitePage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const sitesQuery = useQuery({
    queryKey: ["sites"],
    queryFn: () => apiGet<Site[]>("/api/sites"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        country: form.country.trim(),
        language: form.language.trim() || null,
        url: form.url.trim(),
        forCaller: form.forCaller,
        forAccount: form.forAccount,
      };
      if (!payload.name || !payload.country || !payload.url) {
        throw new Error("Name, country, and URL are required.");
      }
      if (editing) {
        await apiPut<Site>(`/api/sites/${editing.id}`, payload);
      } else {
        await apiPost<Site>("/api/sites", payload);
      }
    },
    onSuccess: async () => {
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(site: Site) {
    setEditing(site);
    setForm({
      name: site.name,
      country: site.country,
      language: site.language ?? "",
      url: site.url,
      forCaller: site.forCaller,
      forAccount: site.forAccount,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleDelete(site: Site) {
    if (
      !window.confirm(
        `Delete site “${site.name}”? This is blocked if real guys still use it.`,
      )
    ) {
      return;
    }
    try {
      await apiDelete(`/api/sites/${site.id}`);
      await qc.invalidateQueries({ queryKey: ["sites"] });
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  if (sitesQuery.isLoading) return <p className="muted">Loading sites…</p>;
  if (sitesQuery.isError) {
    return (
      <p className="error">
        {(sitesQuery.error as Error).message ||
          "Failed to load sites. Is the API running?"}
      </p>
    );
  }

  const sites = sitesQuery.data ?? [];

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Sites</h1>
        <button
          type="button"
          className="btn primary icon-only"
          onClick={openCreate}
          aria-label="Add site"
          title="Add site"
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
              <th>Country</th>
              <th>Language</th>
              <th>URL</th>
              <th>For caller</th>
              <th>For account</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.country}</td>
                <td>{s.language || "—"}</td>
                <td>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.url}
                  </a>
                </td>
                <td>{s.forCaller ? "Yes" : "No"}</td>
                <td>{s.forAccount ? "Yes" : "No"}</td>
                <td className="actions">
                  <button
                    type="button"
                    className="btn link icon-only"
                    aria-label="Edit site"
                    title="Edit"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn link danger icon-only"
                    aria-label="Delete site"
                    title="Delete"
                    onClick={() => void handleDelete(s)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sites.length === 0 && (
          <p className="muted pad">No sites yet. Add one to get started.</p>
        )}
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
            <h2>{editing ? "Edit site" : "New site"}</h2>
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
                Country
                <select
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  required
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Language
                <select
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                >
                  <option value="">Select language...</option>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                URL
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.forCaller}
                  onChange={(e) =>
                    setForm({ ...form, forCaller: e.target.checked })
                  }
                />
                For caller
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.forAccount}
                  onChange={(e) =>
                    setForm({ ...form, forAccount: e.target.checked })
                  }
                />
                For account
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
