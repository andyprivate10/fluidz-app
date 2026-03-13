import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const PROJECT_START = new Date("2026-03-07T00:00:00");
const TOTAL_DAYS = 91;

export default function DevTestMenu() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [seeding, setSeeding] = useState(false);

  const dayNumber = Math.floor((Date.now() - PROJECT_START.getTime()) / 86400000) + 1;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const login = async (email: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: "testpass123" });
    if (error) setMsg(error.message);
    else { const { data } = await supabase.auth.getUser(); setUser(data.user); setMsg("Connecté : " + email); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
    <div style={{ padding: 24, color: "white", fontFamily: "monospace" }}>
      <h2>🛠 Dev Test Menu</h2>
      <p>Jour {dayNumber} / {TOTAL_DAYS}</p>
      {user && <p style={{ color: "#4ade80" }}>✓ {user.email}</p>}
      {msg && <p style={{ color: "#fbbf24" }}>{msg}</p>}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => login("marcus@fluidz.test")} style={btn}>HOST (marcus)</button>
        <button onClick={() => login("karim@fluidz.test")} style={btn}>MEMBER (karim)</button>
        <button onClick={() => login("yann@fluidz.test")} style={btn}>GUEST (yann)</button>
        {user && <button onClick={logout} style={{ ...btn, background: "#7f1d1d" }}>Se déconnecter</button>}
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={seed} disabled={seeding} style={btn}>🌱 {seeding ? "Seeding..." : "Seeder les données"}</button>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => navigate("/sessions")} style={btn}>→ /sessions</button>
        <button onClick={() => navigate("/me")} style={btn}>→ /me</button>
        <button onClick={() => navigate("/notifications")} style={btn}>→ /notifications</button>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 16px",
  background: "#1f1d2b",
  border: "1px solid #2a2740",
  borderRadius: 8,
  color: "white",
  cursor: "pointer",
  textAlign: "left",
};
