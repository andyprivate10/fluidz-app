import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [seeding, setSeeding] = useState(false);
  const dayNumber = Math.floor((Date.now() - PROJECT_START.getTime()) / 86400000) + 1;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const login = async (email: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: "testpass123" });
    if (error) { setMsg("Erreur: " + error.message); return; }
    setUserEmail(email);
    setMsg("Connecté : " + email);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setMsg("Déconnecté");
  };

  const seed = async () => {
    setSeeding(true);
    setMsg("Seeding...");
    await new Promise(r => setTimeout(r, 1000));
    setMsg("Seed OK");
    setSeeding(false);
  };

  return (
    <div style={{ padding: 24, color: "white", fontFamily: "monospace", maxWidth: 400 }}>
      <h2 style={{ marginBottom: 4 }}>🛠 Dev Test Menu</h2>
      <p style={{ color: "#7e7694", marginBottom: 16 }}>Jour {dayNumber} / {TOTAL_DAYS}</p>
      {userEmail && <p style={{ color: "#4ade80", marginBottom: 8 }}>✓ {userEmail}</p>}
      {msg && <p style={{ color: "#fbbf24", marginBottom: 12 }}>{msg}</p>}

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>PERSONAS</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={() => login("marcus@fluidz.test")} style={btn}>HOST — marcus@fluidz.test</button>
        <button onClick={() => login("karim@fluidz.test")} style={btn}>MEMBER — karim@fluidz.test</button>
        <button onClick={() => login("yann@fluidz.test")} style={btn}>GUEST — yann@fluidz.test</button>
        {userEmail && <button onClick={logout} style={{ ...btn, background: "#450a0a" }}>Se déconnecter</button>}
      </div>

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>DATA</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <button onClick={seed} disabled={seeding} style={btn}>🌱 {seeding ? "Seeding..." : "Seeder les données de démo"}</button>
      </div>

      <p style={{ color: "#7e7694", fontSize: 12, marginBottom: 8 }}>NAVIGATION</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => navigate("/sessions")} style={btn}>→ /sessions</button>
        <button onClick={() => navigate("/me")} style={btn}>→ /me</button>
        <button onClick={() => navigate("/notifications")} style={btn}>→ /notifications</button>
      </div>
    </div>
  );
}
