"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getGalleryConfig } from "@/lib/mediaService";
import QRCode from "react-qrcode-logo";

export default function HomePage() {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [galleryConfig, setGalleryConfig] = useState<{ title: string; pin: string } | null>(null);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [showQR, setShowQR] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    setGalleryUrl(window.location.origin + "/gallery");
    getGalleryConfig().then((cfg) => {
      if (cfg) setGalleryConfig({ title: cfg.title, pin: cfg.pin });
    });
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    const full = [...newPin];
    if (full.every((d) => d !== "")) setTimeout(() => handleSubmit(full.join("")), 100);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (pinValue?: string) => {
    const enteredPin = pinValue ?? pin.join("");
    if (enteredPin.length < 4) return;
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 600));
    const config = galleryConfig ?? (await getGalleryConfig());
    if (config && enteredPin === config.pin) {
      router.push("/gallery");
    } else {
      setLoading(false);
      setShaking(true);
      setError("Incorrect PIN. Please try again.");
      setPin(["", "", "", ""]);
      setTimeout(() => { setShaking(false); inputRefs.current[0]?.focus(); }, 600);
    }
  };

  const allFilled = pin.every((d) => d);

  return (
    <main style={{ minHeight:"100vh", background:"#050508", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <div className="orb" style={{ width:500, height:500, background:"radial-gradient(circle, rgba(200,169,110,0.15) 0%, transparent 70%)", top:"-10%", right:"-10%", animationDuration:"30s" }} />
      <div className="orb" style={{ width:400, height:400, background:"radial-gradient(circle, rgba(100,80,200,0.1) 0%, transparent 70%)", bottom:"-5%", left:"-8%", animationDuration:"25s", animationDelay:"-10s" }} />
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:460, padding:"0 20px" }}>
        <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, ease:[0.16,1,0.3,1] }}>
          {/* Brand */}
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.1, duration:0.6 }}
              style={{ width:72, height:72, borderRadius:22, background:"linear-gradient(135deg, rgba(200,169,110,0.22) 0%, rgba(200,169,110,0.07) 100%)", border:"1px solid rgba(200,169,110,0.28)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 8px 32px rgba(200,169,110,0.12)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="rgba(200,169,110,0.4)" strokeWidth="1"/>
                <rect x="5" y="11" width="5" height="7" rx="1" stroke="#c8a96e" strokeWidth="1.5"/>
                <rect x="14" y="8" width="5" height="10" rx="1" stroke="#c8a96e" strokeWidth="1.5"/>
                <path d="M8 11V8a4 4 0 0 1 8 0" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </motion.div>
            <h1 style={{ fontSize:28, fontWeight:600, letterSpacing:"-0.5px", background:"linear-gradient(135deg, #f5f5f7 0%, rgba(245,245,247,0.65) 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>
              {galleryConfig?.title || "Private Gallery"}
            </h1>
            <p style={{ color:"rgba(245,245,247,0.4)", fontSize:14, letterSpacing:"0.2px" }}>Enter your 4-digit PIN to continue</p>
          </div>

          {/* Card */}
          <div className="glass-dark" style={{ borderRadius:24, padding:"36px 32px", boxShadow:"0 40px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.06)" }}>
            <motion.div animate={shaking ? { x:[0,-12,12,-10,10,-6,6,0] } : {}} transition={{ duration:0.5 }}
              style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:28 }}>
              {pin.map((digit, i) => (
                <input key={i} ref={(el) => { inputRefs.current[i] = el; }}
                  type="tel" inputMode="numeric" maxLength={1}
                  value={digit ? "●" : ""}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`pin-digit ${digit ? "filled" : ""}`}
                  autoFocus={i === 0}
                  style={{ caretColor:"transparent" }}
                />
              ))}
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ textAlign:"center", color:"#ff453a", fontSize:13, marginBottom:16 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button onClick={() => handleSubmit()} disabled={loading || !allFilled}
              style={{ width:"100%", height:52, borderRadius:14, background: allFilled ? "linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)" : "rgba(255,255,255,0.05)", border:"none", cursor: allFilled ? "pointer" : "not-allowed", color: allFilled ? "#050508" : "rgba(245,245,247,0.28)", fontSize:16, fontWeight:600, letterSpacing:"0.2px", transition:"all 0.25s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow: allFilled ? "0 8px 24px rgba(200,169,110,0.28)" : "none" }}>
              {loading ? (
                <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                  style={{ width:20, height:20, borderRadius:"50%", border:"2px solid rgba(5,5,8,0.3)", borderTopColor:"#050508" }} />
              ) : (
                <>Enter Gallery <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></>
              )}
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0 0" }}>
              <div style={{ flex:1, height:"0.5px", background:"rgba(255,255,255,0.07)" }} />
              <span style={{ color:"rgba(245,245,247,0.22)", fontSize:11, letterSpacing:"0.5px", textTransform:"uppercase" }}>OR</span>
              <div style={{ flex:1, height:"0.5px", background:"rgba(255,255,255,0.07)" }} />
            </div>
          </div>

          {/* QR Button */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }} style={{ marginTop:16 }}>
            <button onClick={() => setShowQR(!showQR)} className="glass"
              style={{ width:"100%", padding:"13px 20px", borderRadius:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"rgba(245,245,247,0.55)", fontSize:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", transition:"all 0.2s ease" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14 14H17M17 14V17M17 17H20M20 17V14M20 20H14V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {showQR ? "Hide QR Code" : "Share via QR Code"}
              <motion.div animate={{ rotate: showQR ? 180 : 0 }} transition={{ duration:0.25 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {showQR && galleryUrl && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} transition={{ duration:0.35 }} style={{ overflow:"hidden" }}>
                  <div className="glass-dark" style={{ borderRadius:20, padding:28, marginTop:12, display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
                    <div style={{ borderRadius:16, overflow:"hidden", padding:14, background:"#fff" }}>
                      <QRCode value={galleryUrl} size={170} bgColor="#ffffff" fgColor="#050508" qrStyle="dots" eyeRadius={8} />
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <p style={{ fontSize:13, color:"rgba(245,245,247,0.45)" }}>Scan to visit gallery</p>
                      <p style={{ fontSize:11, color:"rgba(245,245,247,0.28)", marginTop:4 }}>PIN required after scan</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }} style={{ textAlign:"center", marginTop:24 }}>
            <a href="/admin" style={{ fontSize:13, color:"rgba(200,169,110,0.45)", textDecoration:"none", letterSpacing:"0.3px" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(200,169,110,0.75)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,169,110,0.45)")}>
              Admin Dashboard →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
