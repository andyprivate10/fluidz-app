import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { seedAll, clearAll, TEST_INVITE_CODE } from "../lib/seedTestData";
import type { User } from "@supabase/supabase-js";

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
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const dayNumber = Math.floor((Date.now() - PROJECT_START.getTime()) / 86400000) + 1;

  useEffect(() => {
    supabase.auth.getUser().then((res) => setUser(res.data.user));
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setSessionId(stored);
    } catch (_) {}
  }, []);

  const login = async (email: string) => {
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email, password: "testpass123" });
    if (error) { setMsg("Erreur: " + error.message); return null; }
    const res = await supabase.auth.getUser();
    setUser(res.data.user);
    setMsg("Connecté : " + email);
    return res.data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMsg("Déconnecté");
  };

  const seed = async () => {
    setSeeding(true);
    setMsg("Nettoyage + seed en cours...");
    try {
      await clearAll();
      const result = await seedAll();
      setSessionId(result.sessionId);
      try { localStorage.setItem(SESSION_KEY, result.sessionId); } catch (_) {}
      setMsg("Seed OK — choisis un persona ci-dessous");
      setUser(null);
    } catch (err: any) {
      setMsg("Seed ERREUR: " + (err?.message || String(err)));
    } finally {
      setSeeding(false);
    }
  };

  const reset = async () => {
    setMsg("Nettoyage...");
    try {
      await clearAll();
      setMsg("Données test nettoyées");
      setSessionId(null);
      try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    } catch (e: any) {
      setMsg("Reset err: " + e?.message);
    }
  };

  const goHost = async () => {
    await login("marcus@fluidz.test");
    if (sessionId) navigate("/session/" + sessionId + "/host");
  };
  const goMember = async () => {
    await login("karim@fluidz.test");
    if (sessionId) navigate("/session/" + sessionId);
  };
  const goGuest = async () => {
    await login("yann@fluidz.test");
    if (sessionId) navigate("/join/" + TEST_INVITE_CODE);
  };
  const goGhost = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/join/" + TEST_INVITE_CODE);
  };

  return (
    <div style={{ padding: 24, color: "white", fontFamily: "monospace", maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 4 }}>Dev Test Menu</h2>
      <p style={{ color: "#7e7694", marginBottom: 16 }}>Jour {dayNumber} / {TOTAL_DAYS}</p>

      {user && <p style={{ color: "#4ade80", marginBottom: 8 }}>✅ {user.email}</p>}
      {!user && <p style={{ color: "#7e7694", marginBottom: 8 }}>Non connecté</p>}
      {msg && <p style={{ color: "#fbbf24", marginBottom: 12, fontSize: 13 }}>{msg}</p>}

      <p style={{ color: "#f9a8a8", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>1. SEEDER</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={seed} disabled={seeding} style={{ ...btn, background: seeding ? "#2a2740" : "#1f1d2b" }}>
          {seeding ? "⏳ Seed en cours..." : "🌱 Seeder les données"}
        </button>
        <button onClick={reset} style={{ ...btn, background: "#450a0a", fontSize: 12 }}>🗑️ Reset</button>
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
            <button onClick={() => navigate("/session/" + sessionId)} style={{ ...btn, fontSize: 12 }}>Session</button>
            <button onClick={() => navigate("/session/" + sessionId + "/host")} style={{ ...btn, fontSize: 12 }}>Host Dashboard</button>
            <button onClick={() => navigate("/session/" + sessionId + "/apply")} style={{ ...btn, fontSize: 12 }}>Apply</button>
            <button onClick={() => navigate("/session/" + sessionId + "/dm")} style={{ ...btn, fontSize: 12 }}>DM</button>
            <button onClick={() => navigate("/join/" + TEST_INVITE_CODE)} style={{ ...btn, fontSize: 12 }}>Join (invitation)</button>
            <p style={{ color: "#453f5c", fontSize: 10, margin: 0, wordBreak: "break-all" }}>ID: {sessionId}</p>
          </div>
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
