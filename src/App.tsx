import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown, CircleUserRound, FileText, Home, LogOut, MapPinned, ShieldUser, UserRound, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api/client";
import { clearSession, getStoredUser, getToken } from "./auth";
import type { Plan } from "./types";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PlanPage } from "./pages/PlanPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RealGuyPage } from "./pages/RealGuyPage";
import { SitePage } from "./pages/SitePage";
import { UserPage } from "./pages/UserPage";

export default function App() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const token = getToken();
  const user = getStoredUser();
  const isAuthed = Boolean(token && user);
  const today = new Date().toISOString().slice(0, 10);

  const plansQuery = useQuery({
    queryKey: ["plans", "today-widget"],
    queryFn: () => apiGet<Plan[]>("/api/plans"),
    enabled: isAuthed,
  });

  const todayPlan = useMemo(() => {
    if (!user) return null;
    const rows = plansQuery.data ?? [];
    return rows.find((p) => p.userId === user.id && p.date.slice(0, 10) === today) ?? null;
  }, [plansQuery.data, today, user]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const menuEl = userMenuRef.current;
      if (!menuEl) return;
      if (!menuEl.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function logout() {
    setMenuOpen(false);
    clearSession();
    navigate("/login", { replace: true });
  }

  function goProfile() {
    setMenuOpen(false);
    navigate("/profile");
  }

  if (!isAuthed) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">RG MS</div>
        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Home size={16} />
            Home
          </NavLink>
          <NavLink
            to="/sites"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <MapPinned size={16} />
            Site
          </NavLink>
          <NavLink
            to="/realguys"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <UserRound size={16} />
            People
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <FileText size={16} />
            Plan
          </NavLink>
          {user?.role === 1 && (
            <NavLink
              to="/users"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <ShieldUser size={16} />
              Users
            </NavLink>
          )}
          <div className="user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="btn link user-menu-trigger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <CircleUserRound size={16} />
              {user?.username}
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="user-menu-popover" role="menu">
                <button type="button" className="user-menu-item" role="menuitem" onClick={goProfile}>
                  <CircleUserRound size={14} />
                  Profile
                </button>
                <button type="button" className="user-menu-item danger" role="menuitem" onClick={logout}>
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sites" element={<SitePage />} />
          <Route path="/realguys" element={<RealGuyPage />} />
          <Route path="/plans" element={<PlanPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/users"
            element={user?.role === 1 ? <UserPage /> : <Navigate to="/" replace />}
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {todayPlan && (
        <button
          type="button"
          className="today-plan-sticky card"
          onClick={() => navigate("/plans")}
          title="Open Plan page"
        >
          <div className="today-plan-title">Today Plan</div>
          <div className="today-plan-row">
            <span>EN {todayPlan.english}</span>
            <span>ES {todayPlan.spanish}</span>
            <span>JP {todayPlan.japanese}</span>
          </div>
          <div className={`today-plan-status ${todayPlan.completed ? "ok" : "todo"}`}>
            {todayPlan.completed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {todayPlan.completed ? "Completed" : "In progress"}
          </div>
        </button>
      )}
    </div>
  );
}
