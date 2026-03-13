import { useState, useEffect } from "react";

const PROJECT_START = new Date("2026-03-07T00:00:00");
const TOTAL_DAYS = 91;

function DevTestMenu() {
  const [day, setDay] = useState(0);

  useEffect(() => {
    const diff = Math.floor((Date.now() - PROJECT_START.getTime()) / 86400000);
    setDay(diff);
  }, []);

  return (
    <div style={{ padding: 24, color: "#F0EDFF", background: "#0C0A14", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>🛠 Dev Test Menu</h1>
      <p style={{ color: "#B8B2CC" }}>Jour {day} / {TOTAL_DAYS}</p>
    </div>
  );
}

export default DevTestMenu;
