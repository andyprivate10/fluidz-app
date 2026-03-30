import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { seedAll, clearAll, TEST_INVITE_CODE } from "../lib/seedTestData";
import { seedDemoData, clearDemoData } from "../lib/seedDemoData";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from 'react-i18next';

const PROJECT_START = new Date("2026-03-07T00:00:00");
const TOTAL_DAYS = 91;
const SESSION_KEY = "dev_test_session_id";

const btn: React.CSSProperties = {
  padding: "10px 16px",
  background: "#1f1d2b",
  border: "1px solid #2a2740",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "14px",
  width: "100%",
};

export default function DevTestMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const dayNumber = Math.floor((Date.now() - PROJECT_START.getTime()) / 86400000) + 1;

  // Persist session ID in both localStorage and URL
  const saveSessionId = (sid: string) => {
    setSessionId(sid);
    try { localStorage.setItem(SESSION_KEY, sid); } catch (_) {}
  };

  useEffect(() => {
    supabase.auth.getUser().then((res) => setUser(res.data.user));
    // Restore from URL param first, then localStorage
    const fromUrl = searchParams.get("sid");
    if (fromUrl) {
      saveSessionId(fromUrl);
    } else {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) setSessionId(stored);
      } catch (_) {}
    }
  }, []);

  const login = async (email: string) => {
    setMsg(t('common.connecting'));
    // Force sign out with global scope to clear all sessions
    await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
    // Clear all Supabase auth storage
    try {
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
      Object.keys(sessionStorage).filter(k => k.startsWith('sb-')).forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}
    // Wait for Supabase client to fully reset
    await new Promise(r => setTimeout(r, 800));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: "testpass123" });
    if (error) { setMsg("Error: " + error.message); return null; }
    // Verify login is the correct user
    if (data.user?.email !== email) { setMsg("Error: wrong user " + data.user?.email); return null; }
    setUser(data.user);
    setMsg("Connected: " + email);
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    try {
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
    } catch (_) {}
    setUser(null);
    setMsg("Déconnecté");
    // Force reload to clear all React state
    window.location.reload();
  };

  const seed = async () => {
    setSeeding(true);
    setMsg("Nettoyage + seed en cours...");
    try {
      const result = await seedAll();
      saveSessionId(result.sessionId);
      setMsg("✅ Seed OK — choisis un persona");
      setUser(null);
    } catch (err: any) {
      setMsg("❌ Seed ERREUR: " + (err?.message || String(err)));
    } finally {
      setSeeding(false);
    }
  };

  const reset = async () => {
    setMsg("Nettoyage...");
    try {
      await clearAll();
      setMsg("✅ Données test nettoyées");
      setSessionId(null);
      try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    } catch (e: any) {
      setMsg("❌ Reset err: " + e?.message);
    }
  };

  const seedDemo = async () => {
    setSeedingDemo(true);
    setDemoProgress("Démarrage...");
    try {
      await seedDemoData((step) => setDemoProgress(step));
      setDemoProgress("");
      setMsg("✅ Demo data seeded — 10 users, 5 sessions, 20+ contacts");
      setUser(null);
    } catch (err: any) {
      setMsg("❌ Demo seed ERREUR: " + (err?.message || String(err)));
    } finally {
      setSeedingDemo(false);
    }
  };

  const clearDemo = async () => {
    setMsg("Nettoyage demo...");
    try {
      await clearDemoData();
      setMsg("✅ Demo data nettoyée");
    } catch (e: any) {
      setMsg("❌ Clear demo err: " + e?.message);
    }
  };

  const goHost = async () => {
    const u = await login("marcus@fluidz.test");
    if (u && sessionId) navigate("/session/" + sessionId);
  };
  const goMember = async () => {
    const u = await login("karim@fluidz.test");
    if (u && sessionId) navigate("/session/" + sessionId);
  };
  const goGuest = async () => {
    const u = await login("yann@fluidz.test");
    if (u && sessionId) navigate("/join/" + TEST_INVITE_CODE);
  };
  const goGhost = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/join/" + TEST_INVITE_CODE);
  };

  // Shareable URL for this dev menu with session ID
  const shareUrl = sessionId
    ? `${window.location.origin}/dev/test?dev=1&sid=${sessionId}`
    : null;

  return (
    <div style={{ padding: 24, color: "white", fontFamily: "monospace", maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 4 }}>Dev Test Menu</h2>
      <p style={{ color: "#7e7694", marginBottom: 16 }}>Jour {dayNumber} / {TOTAL_DAYS}</p>

      {user && <p style={{ color: "#4ade80", marginBottom: 8 }}>✅ {user.email}</p>}
      {!user && <p style={{ color: "#7e7694", marginBottom: 8 }}>Non connecté</p>}
      {msg && <p style={{ color: "#fbbf24", marginBottom: 12, fontSize: 13, wordBreak: "break-word" }}>{msg}</p>}

      <p style={{ color: "#f9a8a8", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>1. SEEDER</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={seed} disabled={seeding} style={{ ...btn, background: seeding ? "#2a2740" : "#1f1d2b" }}>
          {seeding ? "⏳ Seed en cours..." : "🌱 Seeder les données (idempotent)"}
        </button>
        <button onClick={reset} style={{ ...btn, background: "#450a0a", fontSize: 12 }}>🗑️ Reset complet</button>
      </div>

      <p style={{ color: "#a78bfa", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>1b. DEMO SEED (rich data)</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={seedDemo} disabled={seedingDemo} style={{ ...btn, background: seedingDemo ? "#2a2740" : "#1a1040", border: "1px solid #4c1d95" }}>
          {seedingDemo ? "⏳ " + demoProgress : "🎭 Seed Demo Data (10 users, 5 sessions, contacts...)"}
        </button>
        <button onClick={clearDemo} style={{ ...btn, background: "#450a0a", fontSize: 12 }}>🗑️ Clear demo data</button>
      </div>

      <p style={{ color: "#7dd3fc", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>1c. FIX TEST PASSWORDS</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <p style={{ color: "#7e7694", fontSize: 11, margin: "0 0 4px" }}>
          If test accounts were created without passwords, run this SQL in Supabase Dashboard &gt; SQL Editor:
        </p>
        <code style={{ background: "#141222", padding: 10, borderRadius: 8, fontSize: 10, color: "#7dd3fc", display: "block", whiteSpace: "pre-wrap", border: "1px solid #2a2740" }}>
{`UPDATE auth.users
SET encrypted_password = crypt('testpass123', gen_salt('bf'))
WHERE email IN (
  'marcus@fluidz.test', 'karim@fluidz.test', 'yann@fluidz.test',
  'lucas@fluidz.test', 'amine@fluidz.test', 'theo@fluidz.test',
  'romain@fluidz.test', 'samir@fluidz.test', 'alex@fluidz.test', 'jules@fluidz.test'
);`}
        </code>
        <button onClick={() => { navigator.clipboard.writeText("UPDATE auth.users SET encrypted_password = crypt('testpass123', gen_salt('bf')) WHERE email IN ('marcus@fluidz.test', 'karim@fluidz.test', 'yann@fluidz.test', 'lucas@fluidz.test', 'amine@fluidz.test', 'theo@fluidz.test', 'romain@fluidz.test', 'samir@fluidz.test', 'alex@fluidz.test', 'jules@fluidz.test');"); setMsg("SQL copié !"); }} style={{ ...btn, fontSize: 12, color: "#7dd3fc", border: "1px solid rgba(125,211,252,0.25)" }}>
          📋 Copier le SQL
        </button>
      </div>

      <p style={{ color: "#f9a8a8", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>
        2. PERSONA {!sessionId && <span style={{ color: "#f87171" }}>(seed d'abord)</span>}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, opacity: sessionId ? 1 : 0.4, pointerEvents: sessionId ? "auto" : "none" }}>
        <button onClick={goHost} style={btn}>
          <span style={{ color: "#f9a8a8" }}>👑 HOST Marcus</span>
          <span style={{ color: "#7e7694", fontSize: 11, display: "block" }}>→ Host Dashboard</span>
        </button>
        <button onClick={goMember} style={btn}>
          <span style={{ color: "#4ade80" }}>✅ MEMBER Karim</span>
          <span style={{ color: "#7e7694", fontSize: 11, display: "block" }}>→ Session (déjà accepté)</span>
        </button>
        <button onClick={goGuest} style={btn}>
          <span style={{ color: "#fbbf24" }}>🆕 GUEST Yann</span>
          <span style={{ color: "#7e7694", fontSize: 11, display: "block" }}>→ Lien invitation → Postuler</span>
        </button>
        <button onClick={goGhost} style={btn}>
          <span style={{ color: "#7e7694" }}>👻 GHOST (sans compte)</span>
          <span style={{ color: "#7e7694", fontSize: 11, display: "block" }}>→ Lien invitation → Sans compte</span>
        </button>
        {user && <button onClick={logout} style={{ ...btn, background: "#450a0a", fontSize: 12 }}>Se déconnecter</button>}
      </div>

      {sessionId && (
        <>
          <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>LIENS DIRECTS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            <button onClick={() => navigate("/session/" + sessionId)} style={{ ...btn, fontSize: 12 }}>Session (vue candidat)</button>
            <button onClick={() => navigate("/session/" + sessionId)} style={{ ...btn, fontSize: 12 }}>Host Dashboard</button>
            <button onClick={() => navigate("/session/" + sessionId + "/apply")} style={{ ...btn, fontSize: 12 }}>Apply Page</button>
            <button onClick={() => navigate("/session/" + sessionId + "/dm")} style={{ ...btn, fontSize: 12 }}>DM</button>
            <button onClick={() => navigate("/session/" + sessionId + "/chat")} style={{ ...btn, fontSize: 12 }}>Group Chat</button>
            <button onClick={() => navigate("/join/" + TEST_INVITE_CODE)} style={{ ...btn, fontSize: 12 }}>Join Page (invitation)</button>
          </div>
          {shareUrl && (
            <button
              onClick={() => { navigator.clipboard.writeText(shareUrl); setMsg("URL copiée !"); }}
              style={{ ...btn, fontSize: 11, color: "#7e7694", marginBottom: 12 }}
            >
              📋 Copier URL dev (avec session ID)
            </button>
          )}
          <p style={{ color: "#453f5c", fontSize: 10, margin: "0 0 16px", wordBreak: "break-all" }}>ID: {sessionId}</p>
        </>
      )}

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>NAV</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button onClick={() => navigate("/sessions")} style={{ ...btn, fontSize: 12 }}>Sessions</button>
        <button onClick={() => navigate("/me")} style={{ ...btn, fontSize: 12 }}>Moi</button>
        <button onClick={() => navigate("/notifications")} style={{ ...btn, fontSize: 12 }}>Notifications</button>
      </div>
    </div>
  );
}
