import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../api/client";
import { COUNTRIES } from "../constants/countries";
import type { PersonType, RealGuy, Site } from "../types";

const STATUS_OPTIONS = [
  { value: 0, label: "-" },
  { value: 1, label: "requested" },
  { value: 2, label: "contacted" },
  { value: 3, label: "rejected" },
  { value: 4, label: "success" },
  { value: 5, label: "gone" },
] as const;

const LANGUAGE_OPTIONS = ["English", "Spanish", "Japanese"] as const;

function getStatusLabel(status: number) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? String(status);
}

function getStatusTagClass(status: number) {
  if (status === 1) return "status-requested";
  if (status === 2) return "status-contacted";
  if (status === 3) return "status-rejected";
  if (status === 4) return "status-success";
  if (status === 5) return "status-gone";
  return "status-null";
}

function formatDateYYYYMMDD(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

function getTypeTagClass(type: PersonType) {
  if (type === "CALLER") return "tag-caller";
  if (type === "ACCOUNT") return "tag-account";
  return "tag-both";
}

type RealGuyForm = {
  name: string;
  country: string;
  language: string;
  address: string;
  type: PersonType;
  siteId: string;
  siteUrl: string;
  linkedin: string;
  phoneNumber: string;
  mails: string;
  myContactInfo: string;
  contactAt: string;
  status: string;
  note: string;
};

function emptyForm(siteIdDefault = ""): RealGuyForm {
  return {
    name: "",
    country: "",
    language: "",
    address: "",
    type: "CALLER",
    siteId: siteIdDefault,
    siteUrl: "",
    linkedin: "https://www.linkedin.com",
    phoneNumber: "",
    mails: "",
    myContactInfo: "",
    contactAt: "",
    status: "0",
    note: "",
  };
}

export function RealGuyPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RealGuy | null>(null);
  const [form, setForm] = useState<RealGuyForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const [draftCountry, setDraftCountry] = useState("");
  const [draftType, setDraftType] = useState<"" | PersonType>("");
  const [draftSiteId, setDraftSiteId] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    country: "",
    type: "" as "" | PersonType,
    siteId: "",
    status: "",
  });

  const sitesQuery = useQuery({
    queryKey: ["sites"],
    queryFn: () => apiGet<Site[]>("/api/sites"),
  });

  const listParams = useMemo(() => {
    const q = new URLSearchParams();
    if (appliedFilters.country.trim()) q.set("country", appliedFilters.country.trim());
    if (appliedFilters.type) q.set("type", appliedFilters.type);
    if (appliedFilters.siteId.trim()) q.set("siteId", appliedFilters.siteId.trim());
    if (appliedFilters.status.trim() !== "") q.set("status", appliedFilters.status.trim());
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [appliedFilters]);

  const realGuysQuery = useQuery({
    queryKey: ["realguys", listParams],
    queryFn: () => apiGet<RealGuy[]>(`/api/realguys${listParams}`),
  });

  function applySearch() {
    setAppliedFilters({
      country: draftCountry,
      type: draftType,
      siteId: draftSiteId,
      status: draftStatus,
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const siteId = Number(form.siteId);
      if (!Number.isFinite(siteId) || siteId <= 0) {
        throw new Error("Select a site.");
      }
      const status = Number(form.status);
      if (!Number.isFinite(status)) {
        throw new Error("Status must be a number.");
      }
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        country: form.country.trim(),
        language: form.language.trim(),
        type: form.type,
        siteId,
        status,
      };
      if (form.address.trim()) payload.address = form.address.trim();
      else payload.address = null;
      if (form.siteUrl.trim()) payload.siteUrl = form.siteUrl.trim();
      if (form.linkedin.trim()) payload.linkedin = form.linkedin.trim();
      else payload.linkedin = null;
      if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim();
      else payload.phoneNumber = null;
      if (form.mails.trim()) payload.mails = form.mails.trim();
      else payload.mails = null;
      if (form.myContactInfo.trim()) payload.myContactInfo = form.myContactInfo.trim();
      else payload.myContactInfo = null;
      if (form.contactAt.trim()) payload.contactAt = form.contactAt;
      else payload.contactAt = null;
      if (form.note.trim()) payload.note = form.note.trim();
      else payload.note = null;

      if (!payload.name || !payload.country || !payload.language) {
        throw new Error("Name, country, and language are required.");
      }

      if (editing) {
        await apiPut<RealGuy>(`/api/realguys/${editing.id}`, payload);
      } else {
        await apiPost<RealGuy>("/api/realguys", payload);
      }
    },
    onSuccess: async () => {
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm());
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ["realguys"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  function openCreate() {
    const firstId = sitesQuery.data?.[0]?.id;
    setEditing(null);
    setForm(emptyForm(firstId !== undefined ? String(firstId) : ""));
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(rg: RealGuy) {
    setEditing(rg);
    setForm({
      name: rg.name,
      country: rg.country,
      language: rg.language ?? "",
      address: rg.address ?? "",
      type: rg.type,
      siteId: String(rg.siteId),
      siteUrl: rg.siteUrl,
      linkedin: rg.linkedin ?? "https://www.linkedin.com",
      phoneNumber: rg.phoneNumber ?? "",
      mails: rg.mails ?? "",
      myContactInfo: rg.myContactInfo ?? "",
      contactAt: rg.contactAt
        ? rg.contactAt.slice(0, 10)
        : "",
      status: String(rg.status),
      note: rg.note ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleDelete(rg: RealGuy) {
    if (!window.confirm(`Delete real guy “${rg.name}”?`)) return;
    try {
      await apiDelete(`/api/realguys/${rg.id}`);
      await qc.invalidateQueries({ queryKey: ["realguys"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  if (sitesQuery.isLoading || realGuysQuery.isLoading) {
    return <p className="muted">Loading…</p>;
  }
  if (sitesQuery.isError) {
    return (
      <p className="error">
        {(sitesQuery.error as Error).message || "Failed to load sites."}
      </p>
    );
  }
  if (realGuysQuery.isError) {
    return (
      <p className="error">
        {(realGuysQuery.error as Error).message || "Failed to load real guys."}
      </p>
    );
  }

  const sites = sitesQuery.data ?? [];
  const rows = realGuysQuery.data ?? [];

  return (
    <div className="stack">
      <div className="page-head">
        <h1>People</h1>
        <button
          type="button"
          className="btn primary icon-only"
          onClick={openCreate}
          aria-label="Add person"
          title="Add person"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="card filters">
        <div className="filter-row">
          <label>
            Country
            <select
              value={draftCountry}
              onChange={(e) => setDraftCountry(e.target.value)}
            >
              <option value="">Any</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={draftType}
              onChange={(e) =>
                setDraftType(e.target.value as "" | PersonType)
              }
            >
              <option value="">Any</option>
              <option value="CALLER">CALLER</option>
              <option value="ACCOUNT">ACCOUNT</option>
              <option value="BOTH">BOTH</option>
            </select>
          </label>
          <label>
            Site
            <select
              value={draftSiteId}
              onChange={(e) => setDraftSiteId(e.target.value)}
            >
              <option value="">Any</option>
              {sites.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="">Any</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={String(status.value)}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button
              type="button"
              className="btn primary icon-only"
              aria-label="Search"
              title="Search"
              onClick={applySearch}
            >
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap card">
        <table className="data-table people-table">
          <thead>
            <tr>
              <th className="col-no pinned-left-1">No</th>
              <th className="col-name pinned-left-2">Name</th>
              <th className="col-country pinned-left-3">Country</th>
              <th>Language</th>
              <th className="col-type">Type</th>
              <th className="col-site">Site</th>
              <th className="col-linkedin">LinkedIn</th>
              <th className="col-phone">Phone</th>
              <th className="col-mails">Mails</th>
              <th className="col-myContact">My contact</th>
              <th className="col-status">Status</th>
              <th className="col-contactAt">ContactAt</th>
              <th className="col-note">Note</th>
              <th className="col-action pinned-right-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="col-no pinned-left-1">{r.id}</td>
                <td className="col-name pinned-left-2">{r.name}</td>
                <td className="col-country pinned-left-3">{r.country}</td>
                <td>{r.language || "—"}</td>
                <td className="col-type">
                  <div className="type-cell">
                    <span className={`tag ${getTypeTagClass(r.type)}`}>
                      {r.type}
                    </span>
                  </div>
                </td>
                <td className="col-site">
                  <a href={r.siteUrl} target="_blank" rel="noreferrer">
                    {r.site?.name ?? r.siteId}
                  </a>
                </td>
                <td className="col-linkedin">
                  {r.linkedin ? (
                    <a href={r.linkedin} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} />
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="col-phone">{r.phoneNumber || "—"}</td>
                <td className="col-mails">{r.mails || "—"}</td>
                <td className="col-myContact">{r.myContactInfo || "—"}</td>
                <td className="col-status">
                  <span className={`tag ${getStatusTagClass(r.status)}`}>
                    {getStatusLabel(r.status)}
                  </span>
                </td>
                <td className="col-contactAt">{r.contactAt ? formatDateYYYYMMDD(r.contactAt) : "—"}</td>
                <td className="col-note">{r.note || "—"}</td>
                <td className="actions col-action pinned-right-1">
                  <button
                    type="button"
                    className="btn link icon-only"
                    aria-label="Edit real guy"
                    title="Edit"
                    onClick={() => openEdit(r)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn link danger icon-only"
                    aria-label="Delete real guy"
                    title="Delete"
                    onClick={() => void handleDelete(r)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="muted pad">No matching records.</p>
        )}
      </div>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal card wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editing ? "Edit Person" : "New Person"}</h2>
            {formError && <p className="error small">{formError}</p>}
            <form
              className="form grid-form"
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
                  required
                >
                  <option value="">Select language...</option>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Address
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </label>
              <label>
                Type
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as PersonType })
                  }
                >
                  <option value="CALLER">CALLER</option>
                  <option value="ACCOUNT">ACCOUNT</option>
                  <option value="BOTH">BOTH</option>
                </select>
              </label>
              <label>
                Site
                <select
                  value={form.siteId}
                  onChange={(e) =>
                    setForm({ ...form, siteId: e.target.value })
                  }
                  required
                >
                  <option value="">Select…</option>
                  {sites.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Site URL (optional override)
                <input
                  value={form.siteUrl}
                  onChange={(e) =>
                    setForm({ ...form, siteUrl: e.target.value })
                  }
                  placeholder="Leave empty to use selected site URL"
                />
              </label>
              <label className="span-2">
                LinkedIn
                <input
                  value={form.linkedin}
                  onChange={(e) =>
                    setForm({ ...form, linkedin: e.target.value })
                  }
                />
              </label>
              <label>
                Phone number
                <input
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                />
              </label>
              <label>
                Mails
                <input
                  value={form.mails}
                  onChange={(e) => setForm({ ...form, mails: e.target.value })}
                />
              </label>
              <label className="span-2">
                My contact info
                <textarea
                  rows={2}
                  value={form.myContactInfo}
                  onChange={(e) =>
                    setForm({ ...form, myContactInfo: e.target.value })
                  }
                  placeholder="Your contact details for this person"
                />
              </label>
              <label>
                Contact at
                <input
                  type="date"
                  value={form.contactAt}
                  onChange={(e) =>
                    setForm({ ...form, contactAt: e.target.value })
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  required
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={String(status.value)}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Note
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </label>
              <div className="form-actions span-2">
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
