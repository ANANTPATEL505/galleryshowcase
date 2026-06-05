"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getGalleryConfig } from "@/lib/mediaService";

type Screen = "pin" | "hero";

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("pin");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [galleryConfig, setGalleryConfig] = useState<{ title: string; pin: string; description?: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    getGalleryConfig().then((cfg) => {
      if (cfg) setGalleryConfig({ title: cfg.title, pin: cfg.pin, description: cfg.description });
    });
    // auto-focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    if (newPin.every((d) => d !== "")) setTimeout(() => handleSubmit(newPin.join("")), 120);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (pinValue?: string) => {
    const entered = pinValue ?? pin.join("");
    if (entered.length < 4) return;
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 550));
    const config = galleryConfig ?? (await getGalleryConfig());
    if (config && entered === config.pin) {
      setLoading(false);
      setScreen("hero");
    } else {
      setLoading(false);
      setShaking(true);
      setError("Incorrect PIN. Try again.");
      setPin(["", "", "", ""]);
      setTimeout(() => { setShaking(false); inputRefs.current[0]?.focus(); }, 600);
    }
  };

  const allFilled = pin.every((d) => d);

  return (
    <AnimatePresence mode="wait">
      {screen === "pin" ? (
        <motion.div key="pin"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
        >
          <PinScreen
            pin={pin} error={error} loading={loading} shaking={shaking} allFilled={allFilled}
            config={galleryConfig}
            inputRefs={inputRefs}
            onPinChange={handlePinChange}
            onKeyDown={handleKeyDown}
            onSubmit={() => handleSubmit()}
          />
        </motion.div>
      ) : (
        <motion.div key="hero"
          initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroScreen
            config={galleryConfig}
            onGoPhotos={() => router.push("/gallery?mode=photos")}
            onGoVideos={() => router.push("/gallery?mode=videos")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── PIN Screen ────────────────────────────────────────────────────── */
function PinScreen({
  pin, error, loading, shaking, allFilled, config, inputRefs,
  onPinChange, onKeyDown, onSubmit,
}: {
  pin: string[]; error: string; loading: boolean; shaking: boolean; allFilled: boolean;
  config: { title: string; pin: string; description?: string } | null;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onPinChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  onSubmit: () => void;
}) {
  return (
    <main style={{ minHeight: "100vh", background: "#050508", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Orbs */}
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(200,169,110,0.14) 0%, transparent 70%)", top: "-12%", right: "-12%", animationDuration: "30s" }} />
      <div className="orb" style={{ width: 380, height: 380, background: "radial-gradient(circle, rgba(100,80,200,0.09) 0%, transparent 70%)", bottom: "-5%", left: "-8%", animationDuration: "24s", animationDelay: "-9s" }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(5,5,8,0.7)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Logo / brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, rgba(200,169,110,0.22) 0%, rgba(200,169,110,0.07) 100%)", border: "1px solid rgba(200,169,110,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.6" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.6" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.6" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.6" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#f5f5f7", letterSpacing: "-0.2px" }}>
            {config?.title || "Private Gallery"}
          </span>
        </div>

        {/* Admin link */}
        <a href="/admin" style={{ fontSize: 13, color: "rgba(200,169,110,0.5)", textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(200,169,110,0.15)", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#c8a96e"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(200,169,110,0.35)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(200,169,110,0.5)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(200,169,110,0.15)"; }}>
          Admin
        </a>
      </nav>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px 40px", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          {/* Hero text */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.55 }}
              style={{ width: 70, height: 70, borderRadius: 22, background: "linear-gradient(135deg, rgba(200,169,110,0.2) 0%, rgba(200,169,110,0.06) 100%)", border: "1px solid rgba(200,169,110,0.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 32px rgba(200,169,110,0.1)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C9.24 2 7 4.24 7 7v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-6H9V7a3 3 0 1 1 6 0v2z" fill="rgba(200,169,110,0.7)" />
              </svg>
            </motion.div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", color: "#f5f5f7", marginBottom: 8 }}>
              Enter PIN
            </h1>
            <p style={{ fontSize: 14, color: "rgba(245,245,247,0.38)", letterSpacing: "0.2px" }}>
              {config?.description || "Enter your 4-digit PIN to access the gallery"}
            </p>
          </div>

          {/* Card */}
          <div className="glass-dark" style={{ borderRadius: 24, padding: "36px 32px", boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05)" }}>
            {/* PIN inputs */}
            <motion.div
              animate={shaking ? { x: [0, -12, 12, -10, 10, -6, 6, 0] } : {}}
              transition={{ duration: 0.5 }}
              style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}
            >
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit ? "●" : ""}
                  onChange={(e) => onPinChange(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  className={`pin-digit${digit ? " filled" : ""}`}
                  style={{ caretColor: "transparent" }}
                />
              ))}
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ textAlign: "center", color: "#ff453a", fontSize: 13, marginBottom: 16 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button onClick={onSubmit} disabled={loading || !allFilled}
              style={{ width: "100%", height: 52, borderRadius: 14, background: allFilled ? "linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)" : "rgba(255,255,255,0.05)", border: "none", cursor: allFilled ? "pointer" : "not-allowed", color: allFilled ? "#050508" : "rgba(245,245,247,0.22)", fontSize: 16, fontWeight: 600, letterSpacing: "0.2px", transition: "all 0.25s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: allFilled ? "0 8px 24px rgba(200,169,110,0.28)" : "none" }}>
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(5,5,8,0.25)", borderTopColor: "#050508" }} />
              ) : (
                <>Unlock Gallery <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

/* ─── Hero Screen (shown after correct PIN) ─────────────────────────── */
function HeroScreen({
  config, onGoPhotos, onGoVideos,
}: {
  config: { title: string; description?: string } | null;
  onGoPhotos: () => void;
  onGoVideos: () => void;
}) {
  return (
    <main style={{ position: "fixed", inset: 0, background: "#000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Full-screen hero image ── */}
      <motion.div
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", inset: 0 }}
      >
        <img
          src="/hero.jpg"
          alt="Gallery Cover"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        />
        {/* Dark gradient from bottom for readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,8,0.92) 0%, rgba(5,5,8,0.45) 40%, rgba(5,5,8,0.1) 70%, transparent 100%)" }} />
        {/* Subtle top gradient for navbar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, background: "linear-gradient(rgba(5,5,8,0.55), transparent)" }} />
      </motion.div>

      {/* ── Navbar ── */}
      <nav style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.6" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.2px", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            {config?.title || "Private Gallery"}
          </span>
        </div>
        <a href="/admin" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.35)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.18)"; }}>
          Admin
        </a>
      </nav>

      {/* ── Bottom content ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "0 24px 44px" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Title */}
          <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.15, marginBottom: 6, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            {config?.title || "Our Gallery"}
          </h1>
          {config?.description && (
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 24, letterSpacing: "0.1px", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
              {config.description}
            </p>
          )}
          {!config?.description && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 28, letterSpacing: "0.1px" }}>
              Tap below to explore
            </p>
          )}

          {/* ── Two big buttons ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Photos */}
            <motion.button
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={onGoPhotos}
              style={{
                padding: "18px 16px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.14)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1.5px solid rgba(255,255,255,0.22)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                transition: "box-shadow 0.25s ease",
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(200,169,110,0.35) 0%, rgba(200,169,110,0.12) 100%)", border: "1px solid rgba(200,169,110,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="#c8a96e" strokeWidth="1.8" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="#c8a96e" />
                  <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#c8a96e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Photos</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>View full screen</p>
              </div>
            </motion.button>

            {/* Videos */}
            <motion.button
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={onGoVideos}
              style={{
                padding: "18px 16px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.14)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1.5px solid rgba(255,255,255,0.22)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                transition: "box-shadow 0.25s ease",
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(94,141,240,0.35) 0%, rgba(94,141,240,0.12) 100%)", border: "1px solid rgba(94,141,240,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="14" height="14" rx="2.5" stroke="#5e8df0" strokeWidth="1.8" />
                  <path d="M16 9.5l6-3.5v12l-6-3.5V9.5z" stroke="#5e8df0" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Videos</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Play & watch</p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
