"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getMediaItems, getGalleryConfig } from "@/lib/mediaService";
import { useSwipe } from "@/hooks/useSwipe";
import type { MediaItem } from "@/types";

type Mode = "hub" | "photos" | "videos" | "slideshow";

/* ───────────────────────── Shared Lightbox ────────────────────────────── */
function Lightbox({
  items, startIndex, onClose,
}: {
  items: MediaItem[]; startIndex: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [dir, setDir] = useState(1);
  const [showUI, setShowUI] = useState(true);
  const uiTimer = useRef<NodeJS.Timeout | null>(null);

  const go = useCallback((next: number, d: number) => {
    setDir(d);
    setIdx(((next % items.length) + items.length) % items.length);
  }, [items.length]);

  const resetUI = useCallback(() => {
    setShowUI(true);
    if (uiTimer.current) clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setShowUI(false), 3500);
  }, []);

  useEffect(() => { resetUI(); return () => { if (uiTimer.current) clearTimeout(uiTimer.current); }; }, [idx, resetUI]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(idx + 1, 1);
      if (e.key === "ArrowLeft") go(idx - 1, -1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [idx, go, onClose]);

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => go(idx + 1, 1),
    onSwipeRight: () => go(idx - 1, -1),
  });

  const cur = items[idx];
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "6%" : "-6%", opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-6%" : "6%", opacity: 0, scale: 0.96 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseMove={resetUI} onClick={resetUI}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Ambient glow for images */}
      {cur?.type === "image" && (
        <>
          <img src={cur.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(55px) brightness(0.16) saturate(0.5)", transform: "scale(1.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", pointerEvents: "none" }} />
        </>
      )}

      {/* Media */}
      <AnimatePresence custom={dir} mode="wait">
        {cur && (
          <motion.div key={cur.id} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: "relative", zIndex: 2, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "68px 24px 86px" }}
          >
            {cur.type === "image" ? (
              <img src={cur.url} alt={cur.caption || cur.filename}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.75)" }} />
            ) : (
              <video src={cur.url} controls autoPlay
                style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.75)", background: "#000" }} />
            )}
            <AnimatePresence>
              {cur.caption && showUI && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(5,5,8,0.88)", backdropFilter: "blur(16px)", padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap", maxWidth: "80vw", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <p style={{ fontSize: 13, color: "rgba(245,245,247,0.85)" }}>{cur.caption}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 10, background: "linear-gradient(rgba(0,0,0,0.7), transparent)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
            <button onClick={onClose}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "7px 16px", cursor: "pointer", color: "rgba(245,245,247,0.85)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6L5 12L11 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
            <span style={{ fontSize: 13, color: "rgba(245,245,247,0.4)", fontVariantNumeric: "tabular-nums" }}>{idx + 1} / {items.length}</span>
            <div style={{ width: 72 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arrows */}
      <AnimatePresence>
        {showUI && items.length > 1 && (
          <>
            {[
              { label: "Prev", right: false, d: -1, path: "M15 18L9 12L15 6" },
              { label: "Next", right: true, d: 1, path: "M9 18L15 12L9 6" },
            ].map((b) => (
              <motion.button key={b.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => go(b.right ? idx + 1 : idx - 1, b.d)} aria-label={b.label}
                style={{ position: "absolute", [b.right ? "right" : "left"]: 16, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", background: "rgba(10,10,15,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,245,247,0.85)", zIndex: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={b.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Thumbnail strip */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 26px", zIndex: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.72))", display: "flex", justifyContent: "center" }}>
            <div className="no-scrollbar" style={{ display: "flex", gap: 5, overflowX: "auto", maxWidth: "min(92vw, 640px)", padding: "2px 0" }}>
              {items.map((item, i) => (
                <motion.button key={item.id} onClick={() => go(i, i > idx ? 1 : -1)} whileTap={{ scale: 0.88 }}
                  style={{ flexShrink: 0, width: i === idx ? 44 : 30, height: 30, borderRadius: 6, overflow: "hidden", border: `2px solid ${i === idx ? "#c8a96e" : "transparent"}`, cursor: "pointer", transition: "all 0.2s ease", opacity: i === idx ? 1 : 0.4, background: "none", padding: 0 }}>
                  {item.type === "image"
                    ? <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "rgba(200,169,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#c8a96e"><path d="M5 3L19 12L5 21V3Z" /></svg>
                      </div>}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ───────────────────────── Photos View ────────────────────────────────── */
function PhotosView({ items, onBack }: { items: MediaItem[]; onBack: () => void }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const photos = items.filter((i) => i.type === "image");

  return (
    <div style={{ minHeight: "100vh", background: "#050508", paddingTop: 64 }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, background: "rgba(5,5,8,0.92)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.5)", display: "flex", alignItems: "center", gap: 6, fontSize: 14, minWidth: 44, minHeight: 44 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6L5 12L11 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "#c8a96e" }}>
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#c8a96e" strokeWidth="1.6" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="#c8a96e" />
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#c8a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#f5f5f7", letterSpacing: "-0.2px" }}>Photos</span>
        </div>
        <span style={{ fontSize: 13, color: "rgba(245,245,247,0.3)", minWidth: 40, textAlign: "right" }}>{photos.length}</span>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 48px" }}>
        {photos.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 14 }}>
            <span style={{ fontSize: 52 }}>📷</span>
            <p style={{ color: "rgba(245,245,247,0.4)", fontSize: 15 }}>No photos uploaded yet</p>
          </div>
        ) : (
          <>
            <p style={{ color: "rgba(245,245,247,0.3)", fontSize: 12, letterSpacing: "0.3px", marginBottom: 18 }}>
              {photos.length} photo{photos.length !== 1 ? "s" : ""} · tap to view full screen
            </p>
            <div className="media-grid">
              {photos.map((photo, i) => (
                <motion.div key={photo.id}
                  className="media-thumb photo-thumb"
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35 }}
                  onClick={() => setLightboxIdx(i)}
                >
                  <img src={photo.url} alt={photo.caption || photo.filename} loading="lazy" />
                  <div className="media-thumb-overlay">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 1 2 2h3m8 0h3a2 2 0 0 1 2-2v-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  {photo.caption && (
                    <div className="media-thumb-caption">
                      <p style={{ fontSize: 11, color: "rgba(245,245,247,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox items={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Videos View ────────────────────────────────── */
function VideosView({ items, onBack }: { items: MediaItem[]; onBack: () => void }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const videos = items.filter((i) => i.type === "video");

  return (
    <div style={{ minHeight: "100vh", background: "#050508", paddingTop: 64 }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, background: "rgba(5,5,8,0.92)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.5)", display: "flex", alignItems: "center", gap: 6, fontSize: 14, minWidth: 44, minHeight: 44 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6L5 12L11 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="14" height="14" rx="2.5" stroke="#5e8df0" strokeWidth="1.6" />
            <path d="M16 9.5l6-3.5v12l-6-3.5V9.5z" stroke="#5e8df0" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#f5f5f7", letterSpacing: "-0.2px" }}>Videos</span>
        </div>
        <span style={{ fontSize: 13, color: "rgba(245,245,247,0.3)", minWidth: 40, textAlign: "right" }}>{videos.length}</span>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 48px" }}>
        {videos.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 14 }}>
            <span style={{ fontSize: 52 }}>🎬</span>
            <p style={{ color: "rgba(245,245,247,0.4)", fontSize: 15 }}>No videos uploaded yet</p>
          </div>
        ) : (
          <>
            <p style={{ color: "rgba(245,245,247,0.3)", fontSize: 12, letterSpacing: "0.3px", marginBottom: 18 }}>
              {videos.length} video{videos.length !== 1 ? "s" : ""} · tap to play full screen
            </p>
            <div className="media-grid">
              {videos.map((video, i) => (
                <motion.div key={video.id}
                  className="media-thumb video-thumb"
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.35 }}
                  onClick={() => setLightboxIdx(i)}
                  style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <video src={video.url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                  {/* Play button */}
                  <div className="media-thumb-overlay" style={{ background: "rgba(0,0,0,0.28)" }}>
                    <motion.div whileHover={{ scale: 1.1 }}
                      style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(94,141,240,0.22)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(94,141,240,0.45)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(94,141,240,0.2)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#5e8df0" style={{ marginLeft: 3 }}><path d="M5 3L19 12L5 21V3Z" /></svg>
                    </motion.div>
                  </div>

                  {/* Video badge */}
                  <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.68)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#5e8df0", fontWeight: 700, letterSpacing: "0.6px", zIndex: 2 }}>VIDEO</div>

                  {video.caption && (
                    <div className="media-thumb-caption">
                      <p style={{ fontSize: 11, color: "rgba(245,245,247,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox items={videos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Slideshow View ──────────────────────────────── */
function SlideshowView({
  items, config, onBack,
}: {
  items: MediaItem[];
  config: { title: string; slideshowInterval: number } | null;
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [direction, setDirection] = useState(1);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const interval = config?.slideshowInterval ?? 5000;

  const goTo = useCallback((idx: number, d?: number) => {
    if (!items.length) return;
    setDirection(d ?? (idx > currentIndex ? 1 : -1));
    setCurrentIndex(((idx % items.length) + items.length) % items.length);
    setProgress(0);
  }, [currentIndex, items.length]);

  const next = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);

  // Auto-advance
  useEffect(() => {
    const cur = items[currentIndex];
    if (!isPlaying || !items.length || cur?.type === "video") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    const t0 = Date.now();
    progressRef.current = setInterval(() => setProgress(Math.min(((Date.now() - t0) / interval) * 100, 100)), 50);
    timerRef.current = setTimeout(next, interval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, currentIndex, items, interval, next]);

  const resetUI = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    resetUI();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [currentIndex, resetUI]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      resetUI();
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "p" || e.key === "P") setIsPlaying(p => !p);
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [next, prev, resetUI, onBack]);

  const { onTouchStart, onTouchEnd } = useSwipe({ onSwipeLeft: next, onSwipeRight: prev });

  const cur = items[currentIndex];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "5%" : "-5%", opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-5%" : "5%", opacity: 0, scale: 0.97 }),
  };

  if (!items.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <span style={{ fontSize: 52 }}>🎞️</span>
        <p style={{ color: "rgba(245,245,247,0.4)", fontSize: 15 }}>No media to show</p>
        <button onClick={onBack} style={{ marginTop: 8, padding: "10px 22px", borderRadius: 10, background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.28)", color: "#c8a96e", cursor: "pointer", fontSize: 14 }}>← Back</button>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#050508", position: "relative", overflow: "hidden", userSelect: "none" }}
      onMouseMove={resetUI} onClick={resetUI}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Ambient background */}
      {cur?.type === "image" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
          <img src={cur.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(60px) brightness(0.16) saturate(0.5)", transform: "scale(1.15)" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.62)" }} />
        </div>
      )}

      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}
            style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 100, background: "linear-gradient(rgba(5,5,8,0.88), transparent)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", cursor: "pointer", color: "rgba(245,245,247,0.7)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6L5 12L11 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "rgba(245,245,247,0.38)", fontVariantNumeric: "tabular-nums" }}>{currentIndex + 1} / {items.length}</span>
              {/* Type badge */}
              {cur?.type === "video" && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#a06ee8", background: "rgba(160,110,232,0.12)", border: "1px solid rgba(160,110,232,0.25)", borderRadius: 5, padding: "2px 7px", letterSpacing: "0.5px" }}>VIDEO</span>
              )}
            </div>

            <motion.button onClick={() => setIsPlaying(p => !p)} whileTap={{ scale: 0.9 }}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,245,247,0.7)" }}>
              {isPlaying
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "68px 60px 88px" }}>
        <AnimatePresence custom={direction} mode="wait">
          {cur && (
            <motion.div key={cur.id} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ width: "100%", maxWidth: "min(90vw, 1020px)", height: "min(72vh, 700px)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {cur.type === "image" ? (
                <div style={{ width: "100%", height: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04)" }}>
                  <img src={cur.url} alt={cur.caption || cur.filename}
                    className="ken-burns"
                    style={{ width: "100%", height: "100%", objectFit: "contain", background: "#050508" }} />
                </div>
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: 20, overflow: "hidden", background: "#000", boxShadow: "0 40px 80px rgba(0,0,0,0.72)" }}>
                  <video ref={videoRef} src={cur.url} autoPlay controls onEnded={next}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              )}

              <AnimatePresence>
                {cur.caption && showControls && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(5,5,8,0.88)", backdropFilter: "blur(16px)", padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap", maxWidth: "80vw", overflow: "hidden", textOverflow: "ellipsis", zIndex: 2 }}>
                    <p style={{ fontSize: 13, color: "rgba(245,245,247,0.85)" }}>{cur.caption}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Arrows */}
        <AnimatePresence>
          {showControls && items.length > 1 && (
            <>
              {[
                { label: "Prev", right: false, onClick: prev, path: "M15 18L9 12L15 6" },
                { label: "Next", right: true, onClick: next, path: "M9 18L15 12L9 6" },
              ].map((b) => (
                <motion.button key={b.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={b.onClick} aria-label={b.label}
                  style={{ position: "absolute", [b.right ? "right" : "left"]: 8, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", background: "rgba(10,10,15,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,245,247,0.85)", zIndex: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={b.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </motion.button>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.22 }}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px 28px", zIndex: 100, background: "linear-gradient(transparent, rgba(5,5,8,0.92))", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {isPlaying && cur?.type !== "video" && (
              <div style={{ width: "100%", maxWidth: 400, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1, overflow: "hidden" }}>
                <motion.div key={`${currentIndex}-p`}
                  style={{ height: "100%", background: "linear-gradient(90deg, #a06ee8, #c8a96e)", borderRadius: 1 }}
                  initial={{ width: "0%" }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0 }}
                />
              </div>
            )}
            <div className="no-scrollbar" style={{ display: "flex", gap: 5, overflowX: "auto", maxWidth: "min(92vw, 640px)", padding: "2px 0" }}>
              {items.map((item, i) => (
                <motion.button key={item.id} onClick={() => goTo(i)} whileTap={{ scale: 0.88 }}
                  style={{ flexShrink: 0, width: i === currentIndex ? 44 : 30, height: 30, borderRadius: 6, overflow: "hidden", border: `2px solid ${i === currentIndex ? "#a06ee8" : "transparent"}`, cursor: "pointer", transition: "all 0.2s ease", opacity: i === currentIndex ? 1 : 0.4, background: "none", padding: 0 }}>
                  {item.type === "image"
                    ? <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "rgba(160,110,232,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#a06ee8"><path d="M5 3L19 12L5 21V3Z" /></svg>
                      </div>}
                </motion.button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(245,245,247,0.28)", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                {cur?.type === "video" ? "Video" : isPlaying ? "Auto-playing" : "Paused"} · {items.length} items
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Gallery Hub ─────────────────────────────────── */
function GalleryHub({
  items, config, onSelect,
}: {
  items: MediaItem[];
  config: { title: string; slideshowInterval: number } | null;
  onSelect: (mode: Mode) => void;
}) {
  const router = useRouter();
  const photos = items.filter((i) => i.type === "image");
  const videos = items.filter((i) => i.type === "video");

  const cards = [
    {
      mode: "photos" as Mode,
      label: "Photos",
      desc: "Browse & view full‑screen",
      count: photos.length,
      unit: "photo",
      accent: "#c8a96e",
      accentAlpha: "rgba(200,169,110,",
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#c8a96e" strokeWidth="1.6" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="#c8a96e" />
          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#c8a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      previews: photos.slice(0, 4),
    },
    {
      mode: "videos" as Mode,
      label: "Videos",
      desc: "Play with full controls",
      count: videos.length,
      unit: "video",
      accent: "#5e8df0",
      accentAlpha: "rgba(94,141,240,",
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="14" height="14" rx="2.5" stroke="#5e8df0" strokeWidth="1.6" />
          <path d="M16 9.5l6-3.5v12l-6-3.5V9.5z" stroke="#5e8df0" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      ),
      previews: videos.slice(0, 4),
    },
    {
      mode: "slideshow" as Mode,
      label: "Slideshow",
      desc: "Cinematic auto‑play show",
      count: items.length,
      unit: "item",
      accent: "#a06ee8",
      accentAlpha: "rgba(160,110,232,",
      icon: (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="20" height="14" rx="2.5" stroke="#a06ee8" strokeWidth="1.6" />
          <path d="M10 9l5 3-5 3V9z" fill="#a06ee8" />
          <path d="M8 20h8" stroke="#a06ee8" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      previews: items.slice(0, 4),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050508", position: "relative", overflow: "hidden" }}>
      {/* Orbs */}
      <div className="orb" style={{ width: 480, height: 480, background: "radial-gradient(circle, rgba(200,169,110,0.11) 0%, transparent 70%)", top: "-8%", right: "-8%", animationDuration: "30s" }} />
      <div className="orb" style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(94,141,240,0.07) 0%, transparent 70%)", bottom: "0%", left: "-6%", animationDuration: "24s", animationDelay: "-9s" }} />
      <div className="orb" style={{ width: 280, height: 280, background: "radial-gradient(circle, rgba(160,110,232,0.07) 0%, transparent 70%)", top: "45%", left: "50%", animationDuration: "20s", animationDelay: "-5s" }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 100, background: "rgba(5,5,8,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.45)", display: "flex", alignItems: "center", gap: 6, fontSize: 14, minWidth: 44, minHeight: 44 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6L5 12L11 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Exit
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#f5f5f7", letterSpacing: "-0.2px" }}>{config?.title || "Gallery"}</span>
        <div style={{ width: 60 }} />
      </nav>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "84px 20px 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.55 }}
            style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg, rgba(200,169,110,0.2) 0%, rgba(200,169,110,0.06) 100%)", border: "1px solid rgba(200,169,110,0.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", boxShadow: "0 8px 32px rgba(200,169,110,0.12)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.5" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#c8a96e" strokeWidth="1.5" />
            </svg>
          </motion.div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.7px", color: "#f5f5f7", marginBottom: 10 }}>
            What would you like to view?
          </h1>
          <p style={{ fontSize: 15, color: "rgba(245,245,247,0.38)", lineHeight: 1.5 }}>
            {items.length} item{items.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {photos.length} photo{photos.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, width: "100%" }}>
          {cards.map((card, i) => (
            <motion.button
              key={card.mode}
              className="hub-card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.09, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(card.mode)}
              disabled={card.count === 0}
              style={{
                position: "relative",
                background: "rgba(10,10,15,0.82)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: `1px solid ${card.accentAlpha}0.22)`,
                borderRadius: 22,
                padding: "26px 24px 22px",
                cursor: card.count === 0 ? "not-allowed" : "pointer",
                textAlign: "left",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                opacity: card.count === 0 ? 0.42 : 1,
              }}
            >
              {/* Gradient fill */}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${card.accentAlpha}0.14) 0%, ${card.accentAlpha}0.03) 100%)`, borderRadius: 22, pointerEvents: "none" }} />

              {/* Preview thumbnails (subtle) */}
              {card.previews.length > 0 && (
                <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "32%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, opacity: 0.14, overflow: "hidden", borderRadius: "0 22px 22px 0", pointerEvents: "none" }}>
                  {card.previews.map((item) =>
                    item.type === "image"
                      ? <img key={item.id} src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div key={item.id} style={{ background: "rgba(255,255,255,0.08)" }} />
                  )}
                </div>
              )}

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ marginBottom: 14 }}>{card.icon}</div>
                <p style={{ fontSize: 19, fontWeight: 700, color: "#f5f5f7", letterSpacing: "-0.35px", marginBottom: 5 }}>{card.label}</p>
                <p style={{ fontSize: 13, color: "rgba(245,245,247,0.42)", marginBottom: 18, lineHeight: 1.45 }}>{card.desc}</p>

                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${card.accentAlpha}0.12)`, border: `1px solid ${card.accentAlpha}0.25)`, borderRadius: 8, padding: "5px 12px" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: card.accent, fontVariantNumeric: "tabular-nums" }}>{card.count}</span>
                  <span style={{ fontSize: 12, color: "rgba(245,245,247,0.38)" }}>{card.count === 1 ? card.unit : card.unit + "s"}</span>
                </div>
              </div>

              {card.count > 0 && (
                <div style={{ position: "absolute", bottom: 22, right: 20, color: card.accent, opacity: 0.55 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Keyboard hint */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ marginTop: 36, fontSize: 12, color: "rgba(245,245,247,0.2)", letterSpacing: "0.3px", textAlign: "center" }}>
          In slideshow: ← → to navigate · Space to pause · Esc to go back
        </motion.p>
      </div>
    </div>
  );
}

/* ───────────────────────── Root Page ───────────────────────────────────── */
export default function GalleryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [config, setConfig] = useState<{ title: string; slideshowInterval: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("hub");

  useEffect(() => {
    Promise.all([getMediaItems(), getGalleryConfig()]).then(([media, cfg]) => {
      setItems(media);
      if (cfg) setConfig({ title: cfg.title, slideshowInterval: cfg.slideshowInterval });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div className="orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(200,169,110,0.09) 0%, transparent 70%)", top: "20%", left: "30%" }} />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.07)", borderTopColor: "#c8a96e", position: "relative", zIndex: 1 }} />
        <p style={{ color: "rgba(245,245,247,0.32)", fontSize: 14, letterSpacing: "0.5px", position: "relative", zIndex: 1 }}>Loading gallery…</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {mode === "hub" && (
        <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          <GalleryHub items={items} config={config} onSelect={setMode} />
        </motion.div>
      )}
      {mode === "photos" && (
        <motion.div key="photos" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -22 }} transition={{ duration: 0.3 }}>
          <PhotosView items={items} onBack={() => setMode("hub")} />
        </motion.div>
      )}
      {mode === "videos" && (
        <motion.div key="videos" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -22 }} transition={{ duration: 0.3 }}>
          <VideosView items={items} onBack={() => setMode("hub")} />
        </motion.div>
      )}
      {mode === "slideshow" && (
        <motion.div key="slideshow" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.32 }}>
          <SlideshowView items={items} config={config} onBack={() => setMode("hub")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
