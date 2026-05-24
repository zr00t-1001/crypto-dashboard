import { useEffect, useState } from "react";

const ZONES = [
  { label: "NEW YORK", tz: "America/New_York" },
  { label: "LONDON", tz: "Europe/London" },
  { label: "TOKYO", tz: "Asia/Tokyo" },
  { label: "MADRID", tz: "Europe/Madrid" },
];

function timeIn(tz: string, date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(date);
}
function dayIn(tz: string, date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short" })
    .format(date).toUpperCase();
}

export default function WorldClocks() {
  // `mounted` is false during SSR and the first client render, so server
  // and client produce identical HTML (placeholders). Real time appears
  // only after mount — eliminating the hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-4 border max-md:grid-cols-2"
      style={{ borderColor: "var(--grid-strong)", backgroundColor: "var(--bg-panel)" }}>
      {ZONES.map((z, i) => (
        <div key={z.tz} className="flex flex-col gap-2 px-6 py-6"
          style={{ borderLeft: i === 0 ? "none" : "1px solid var(--grid)" }}>
          <div className="flex items-center justify-between">
            <span className="label">{z.label}</span>
            <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>
              {mounted ? dayIn(z.tz, now) : "—"}
            </span>
          </div>
          <span className="tabular text-4xl font-bold max-md:text-3xl"
            style={{ color: "var(--color-accent)" }}>
            {mounted ? timeIn(z.tz, now) : "--:--:--"}
          </span>
        </div>
      ))}
    </div>
  );
}