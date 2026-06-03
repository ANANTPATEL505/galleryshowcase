"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getMediaItems, getGalleryConfig } from "@/lib/mediaService";
import { useSwipe } from "@/hooks/useSwipe";
import type { MediaItem } from "@/types";

export default function GalleryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [config, setConfig] = useState<{ title: string; slideshowInterval: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [direction, setDirection] = useState(1);
  const [gridView, setGridView] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();

  const interval = config?.slideshowInterval ?? 5000;

  useEffect(() => {
    Promise.all([getMediaItems(), getGalleryConfig()]).then(([media, cfg]) => {
      setItems(media);
      if (cfg) setConfig({ title: cfg.title, slideshowInterval: cfg.slideshowInterval });
      setLoading(false);
    });
  }, []);

  const goTo = useCallback((idx: number, dir?: number) => {
    if (items.length === 0) return;
    const newDir = dir ?? (idx > currentIndex ? 1 : -1);
    setDirection(newDir);
    setCurrentIndex(((idx % items.length) + items.length) % items.length);
    setProgress(0);
  }, [currentIndex, items.length]);

  const next = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying || items.length === 0 || gridView) return;
    const current = items[currentIndex];
    if (current?.type === "video") return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / interval) * 100, 100));
    }, 50);
    timerRef.current = setTimeout(() => next(), interval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, currentIndex, items, interval, gridView, next]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (!gridView) setShowControls(false);
    }, 3500);
  }, [gridView]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [currentIndex, resetControlsTimer]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      resetControlsTimer();
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") { setIsFullscreen(false); setGridView(false); }
      if (e.key === "f" || e.key === "F") setIsFullscreen(f => !f);
      if (e.key === "p" || e.key === "P") setIsPlaying(p => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, resetControlsTimer]);

  // Swipe gestures
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: next,
    onSwipeRight: prev,
  });

  const currentItem = items[currentIndex];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div className="orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(200,169,110,0.1) 0%, transparent 70%)", top: "20%", left: "30%" }} />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#c8a96e" }} />
        <p style={{ color: "rgba(245,245,247,0.35)", fontSize: 14, letterSpacing: "0.5px" }}>Loading gallery…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
        <div style={{ fontSize: 52 }}>🖼️</div>
        <h2 style={{ color: "#f5f5f7", fontSize: 20, fontWeight: 500 }}>Gallery is empty</h2>
        <p style={{ color: "rgba(245,245,247,0.4)", fontSize: 14, textAlign: "center" }}>No media has been uploaded yet.</p>
        <button onClick={() => router.push("/")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.28)", color: "#c8a96e", cursor: "pointer", fontSize: 14 }}>
          ← Back to Home
        </button>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "6%" : "-6%", opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-6%" : "6%", opacity: 0, scale: 0.97 }),
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#050508", position: "relative", overflow: "hidden", userSelect: "none" }}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Ambient background blur */}
      {currentItem && !gridView && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, transition: "opacity 1s ease" }}>
          {currentItem.type === "image" && (
            <img src={currentItem.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(60px) brightness(0.2) saturate(0.5)", transform: "scale(1.15)", transition: "opacity 0.8s ease" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.65)" }} />
        </div>
      )}

      {!gridView ? (
        /* ── SLIDESHOW ── */
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "72px 20px 96px" }}>

          {/* Top bar */}
          <AnimatePresence>
            {showControls && (
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
                style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100, background: "linear-gradient(rgba(5,5,8,0.9), transparent)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.5)", display: "flex", alignItems: "center", gap: 6, fontSize: 14, padding: "8px 0", minWidth: 44, minHeight: 44 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6L5 12L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span style={{ display: "none", }}></span>
                  <span style={{ display: "block" }}>Exit</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(245,245,247,0.35)", fontVariantNumeric: "tabular-nums" }}>
                    {currentIndex + 1} / {items.length}
                  </span>
                  <button onClick={() => setGridView(true)}
                    style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer", color: "rgba(245,245,247,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                  </button>
                  <button onClick={() => setIsFullscreen(f => !f)}
                    style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer", color: "rgba(245,245,247,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isFullscreen
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 1 2 2h3m8 0h3a2 2 0 0 1 2-2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slide */}
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: isFullscreen ? "100vw" : "min(92vw, 1000px)",
            height: isFullscreen ? "100vh" : "min(72vh, 700px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AnimatePresence custom={direction} mode="wait">
              {currentItem && (
                <motion.div
                  key={currentItem.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {currentItem.type === "image" ? (
                    <div style={{ width: "100%", height: "100%", borderRadius: isFullscreen ? 0 : 18, overflow: "hidden", boxShadow: isFullscreen ? "none" : "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)" }}>
                      <img
                        src={currentItem.url}
                        alt={currentItem.caption || currentItem.filename}
                        className={isFullscreen ? "" : "ken-burns"}
                        style={{ width: "100%", height: "100%", objectFit: "contain", background: "#050508" }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "100%", borderRadius: isFullscreen ? 0 : 18, overflow: "hidden", background: "#000", boxShadow: isFullscreen ? "none" : "0 40px 80px rgba(0,0,0,0.7)" }}>
                      <video
                        ref={videoRef}
                        src={currentItem.url}
                        autoPlay
                        controls
                        onEnded={next}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <AnimatePresence>
                    {currentItem.caption && showControls && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ position: "absolute", bottom: isFullscreen ? 90 : 14, left: "50%", transform: "translateX(-50%)", background: "rgba(5,5,8,0.82)", backdropFilter: "blur(16px)", padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap", maxWidth: "80vw", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <p style={{ fontSize: 13, color: "rgba(245,245,247,0.82)" }}>{currentItem.caption}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prev / Next arrows — hidden on mobile (use swipe) */}
            <AnimatePresence>
              {showControls && items.length > 1 && (
                <>
                  {[
                    { onClick: prev, side: isFullscreen ? 20 : -22, icon: "M15 18L9 12L15 6", label: "Previous" },
                    { onClick: next, side: isFullscreen ? 20 : -22, icon: "M9 18L15 12L9 6", label: "Next", right: true },
                  ].map((btn) => (
                    <motion.button
                      key={btn.label}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={btn.onClick}
                      aria-label={btn.label}
                      style={{
                        position: "absolute",
                        [btn.right ? "right" : "left"]: btn.side,
                        top: "50%", transform: "translateY(-50%)",
                        width: 46, height: 46, borderRadius: "50%",
                        background: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "rgba(245,245,247,0.8)", zIndex: 10,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d={btn.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.button>
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
                style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "20px 20px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 100, background: "linear-gradient(transparent, rgba(5,5,8,0.92))" }}>

                {/* Progress bar */}
                {isPlaying && currentItem?.type !== "video" && (
                  <div style={{ width: "100%", maxWidth: 420, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1, overflow: "hidden" }}>
                    <motion.div
                      key={`${currentIndex}-p`}
                      style={{ height: "100%", background: "linear-gradient(90deg, #c8a96e, #f0d98e)", borderRadius: 1 }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0 }}
                    />
                  </div>
                )}

                {/* Thumbnail strip */}
                <div className="no-scrollbar" style={{ display: "flex", gap: 5, overflowX: "auto", maxWidth: "min(92vw, 640px)", padding: "2px 0" }}>
                  {items.map((item, i) => (
                    <motion.button
                      key={item.id}
                      onClick={() => goTo(i)}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        flexShrink: 0,
                        width: i === currentIndex ? 42 : 30,
                        height: 30,
                        borderRadius: 6,
                        overflow: "hidden",
                        border: `2px solid ${i === currentIndex ? "#c8a96e" : "transparent"}`,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        opacity: i === currentIndex ? 1 : 0.45,
                        background: "none",
                        padding: 0,
                      }}
                    >
                      {item.type === "image" ? (
                        <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "rgba(200,169,110,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#c8a96e"><path d="M5 3L19 12L5 21V3Z" /></svg>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Play / pause */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <motion.button onClick={() => setIsPlaying(p => !p)} whileTap={{ scale: 0.9 }}
                    style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,245,247,0.8)" }}>
                    {isPlaying
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                  </motion.button>
                  <span style={{ fontSize: 11, color: "rgba(245,245,247,0.3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                    {currentItem?.type === "video" ? "Video" : isPlaying ? "Playing" : "Paused"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div style={{ position: "relative", zIndex: 1, padding: "68px 16px 40px" }}>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, background: "rgba(5,5,8,0.92)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 100 }}>
            <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.5)", display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6L5 12L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Exit
            </button>
            <span style={{ fontSize: 14, color: "rgba(245,245,247,0.6)", fontWeight: 500 }}>{config?.title || "Gallery"}</span>
            <button onClick={() => setGridView(false)} style={{ background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.22)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#c8a96e", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
              Slideshow
            </button>
          </div>

          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ color: "rgba(245,245,247,0.3)", fontSize: 12, marginBottom: 16, letterSpacing: "0.3px" }}>{items.length} items</p>
            <div className="media-grid">
              {items.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03, duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { goTo(i); setGridView(false); }}
                  style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", cursor: "pointer", position: "relative", border: `2px solid ${i === currentIndex ? "#c8a96e" : "transparent"}`, transition: "border-color 0.2s ease" }}
                >
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.caption || item.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(200,169,110,0.28)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#c8a96e"><path d="M5 3L19 12L5 21V3Z" /></svg>
                        </div>
                      </div>
                    </div>
                  )}
                  {item.caption && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 8px 7px", background: "linear-gradient(transparent, rgba(5,5,8,0.88))" }}>
                      <p style={{ fontSize: 11, color: "rgba(245,245,247,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
