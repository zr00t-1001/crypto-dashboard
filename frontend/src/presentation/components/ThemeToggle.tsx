import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    try { localStorage.setItem("theme", next); } catch (_) {}
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
      style={{
        borderColor: "var(--grid-strong)",
        color: "var(--color-accent)",
        backgroundColor: "var(--bg-panel)",
      }}
    >
      {theme === "dark" ? "◐ DARK" : "◑ LIGHT"}
    </button>
  );
}