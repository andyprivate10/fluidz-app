import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { seedAll } from "../lib/seedTestData";
import type { User } from "@supabase/supabase-js";

const PROJECT_START = new Date("2026-03-07T00:00:00");
const TOTAL_DAYS = 91;

const btn = {
  padding: "10px 16px",
  background: "#1f1d2b",
  border: "1px solid #2a2740",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
  textAlign: "left" as const,
  fontSize: "14px",
};

export default function DevTestMenu() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [seeding, setSeeding] = useState(false);
  const dayNumber = Math.floor((Date.now() - PROJECT_START.getTime()) / 86400000) + 1;

  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      setUser(res.data.user);
    });
  }, []);

  const login = async (email: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: "testpass123" });
    if (error) { setMsg("Erreur: " + error.message); return; }
    const res = await supabase.auth.getUser();
    setUser(res.data.user);
    setMsg("Connecte : " + email);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMsg("Deconnecte");
  };

  const seed = async () => {
    setSeeding(true);
    setMsg("Seeding...");
    try {
      const { sessionId } = await seedAll();
      setMsg(`Seed OK - session ID: ${sessionId}`);
    } catch (error) {
      setMsg(`Error: ${error}`);
    }
    setSeeding(false);
  };

  return (
    <div style={{ padding: 24, color: "white", fontFamily: "monospace", maxWidth: 400 }}>
      <h2 style={{ marginBottom: 4 }}>Dev Test Menu</h2>
      <p style={{ color: "#7e7694", marginBottom: 16 }}>Jour {dayNumber} / {TOTAL_DAYS}</p>
      {user && <p style={{ color: "#4ade80", marginBottom: 8 }}>OK {user.email}</p>}
      {msg && <p style={{ color: "#fbbf24", marginBottom: 12 }}>{msg}</p>}

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>PERSONAS</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={() => login("marcus@fluidz.test")} style={btn}>HOST marcus</button>
        <button onClick={() => login("karim@fluidz.test")} style={btn}>MEMBER karim</button>
        <button onClick={() => login("yann@fluidz.test")} style={btn}>GUEST yann</button>
        {user && <button onClick={logout} style={{ ...btn, background: "#450a0a" }}>Se deconnecter</button>}
      </div>

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>DATA</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={seed} disabled={seeding} style={btn}>{seeding ? "Seeding..." : "Seeder les donnees"}</button>
      </div>

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>MODES</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={() => navigate("/join/testplan1")} style={{ ...btn, background: "#1a1a2e", border: "1px solid #4a4a6a" }}>👻 Mode GHOST</button>
      </div>

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>NAVIGATION</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => navigate("/sessions")} style={btn}>sessions</button>
        <button onClick={() => navigate("/me")} style={btn}>me</button>
        <button onClick={() => navigate("/notifications")} style={btn}>notifications</button>
      </div>
    </div>
  );
}
