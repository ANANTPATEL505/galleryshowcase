"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight:"100vh", background:"#050508", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <div className="orb" style={{ width:500, height:500, background:"radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 70%)", top:"-15%", right:"-15%", animationDuration:"28s" }} />
      <div className="orb" style={{ width:350, height:350, background:"radial-gradient(circle, rgba(80,60,160,0.1) 0%, transparent 70%)", bottom:"5%", left:"-5%", animationDuration:"22s", animationDelay:"-8s" }} />
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:420, padding:"0 20px" }}>
        <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}>
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.1 }}
              style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg, rgba(200,169,110,0.2) 0%, rgba(200,169,110,0.06) 100%)", border:"1px solid rgba(200,169,110,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 8px 32px rgba(200,169,110,0.1)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" stroke="#c8a96e" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </motion.div>
            <h1 style={{ fontSize:26, fontWeight:600, letterSpacing:"-0.4px", color:"#f5f5f7", marginBottom:6 }}>Admin Dashboard</h1>
            <p style={{ fontSize:14, color:"rgba(245,245,247,0.4)" }}>Sign in to manage your gallery</p>
          </div>

          {/* Form */}
          <div className="glass-dark" style={{ borderRadius:22, padding:"32px 28px", boxShadow:"0 40px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05)" }}>
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={{ fontSize:13, color:"rgba(245,245,247,0.45)", display:"block", marginBottom:8, letterSpacing:"0.3px" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  style={{ width:"100%", padding:"13px 16px", borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.08)", color:"#f5f5f7", fontSize:15, outline:"none", transition:"all 0.2s ease" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,169,110,0.5)"; e.currentTarget.style.background = "rgba(200,169,110,0.05)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                />
              </div>
              <div>
                <label style={{ fontSize:13, color:"rgba(245,245,247,0.45)", display:"block", marginBottom:8, letterSpacing:"0.3px" }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width:"100%", padding:"13px 16px", borderRadius:12, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.08)", color:"#f5f5f7", fontSize:15, outline:"none", transition:"all 0.2s ease" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,169,110,0.5)"; e.currentTarget.style.background = "rgba(200,169,110,0.05)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                />
              </div>
              <button type="submit" disabled={loading || !email || !password}
                style={{ width:"100%", height:50, borderRadius:12, background: (email && password) ? "linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)" : "rgba(255,255,255,0.05)", border:"none", cursor: (email && password) ? "pointer" : "not-allowed", color: (email && password) ? "#050508" : "rgba(245,245,247,0.25)", fontSize:15, fontWeight:600, letterSpacing:"0.2px", transition:"all 0.25s ease", marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow: (email && password) ? "0 8px 24px rgba(200,169,110,0.25)" : "none" }}>
                {loading ? (
                  <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                    style={{ width:18, height:18, borderRadius:"50%", border:"2px solid rgba(5,5,8,0.3)", borderTopColor:"#050508" }} />
                ) : "Sign In"}
              </button>
            </form>
          </div>

          <div style={{ textAlign:"center", marginTop:24 }}>
            <a href="/" style={{ fontSize:13, color:"rgba(200,169,110,0.4)", textDecoration:"none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(200,169,110,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,169,110,0.4)")}>
              ← Back to Gallery
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
