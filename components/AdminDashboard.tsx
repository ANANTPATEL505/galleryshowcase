"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import {
  getMediaItems,
  getGalleryConfig,
  upsertGalleryConfig,
  deleteMediaItem,
  reorderMediaItems,
  updateMediaItem,
  uploadMedia,
  addMediaItem,
} from "@/lib/mediaService";
import type { MediaItem, GalleryConfig, UploadProgress } from "@/types";
import { formatFileSize, isVideoFile } from "@/lib/utils";
import UploadZone from "@/components/UploadZone";
import MediaCard from "@/components/MediaCard";
import QRCode from "react-qrcode-logo";
import toast from "react-hot-toast";

type Tab = "media" | "settings" | "qr";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [config, setConfig] = useState<GalleryConfig | null>(null);
  const [tab, setTab] = useState<Tab>("media");
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [configForm, setConfigForm] = useState({
    title: "",
    pin: "",
    slideshowInterval: 5000,
    allowDownload: false,
    description: "",
  });

  useEffect(() => {
    setGalleryUrl(window.location.origin);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [media, cfg] = await Promise.all([getMediaItems(), getGalleryConfig()]);
      setItems(media);
      if (cfg) {
        setConfig(cfg);
        setConfigForm({
          title: cfg.title || "",
          pin: cfg.pin || "1234",
          slideshowInterval: cfg.slideshowInterval || 5000,
          allowDownload: cfg.allowDownload ?? false,
          description: cfg.description || "",
        });
      } else {
        // Create default config
        await upsertGalleryConfig({ title: "Private Gallery", pin: "1234", slideshowInterval: 5000, allowDownload: false });
        loadData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (validFiles.length === 0) { toast.error("Only images and videos allowed"); return; }

    const nextOrder = items.length;
    const progressMap: Record<string, UploadProgress> = {};
    validFiles.forEach((f) => {
      progressMap[f.name] = { filename: f.name, progress: 0, status: "uploading" };
    });
    setUploads(Object.values(progressMap));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const { url, storagePath } = await uploadMedia(file, (p) => {
          progressMap[file.name] = p;
          setUploads(Object.values({ ...progressMap }));
        });
        const id = await addMediaItem({
          url,
          storagePath,
          filename: file.name,
          type: isVideoFile(file.name) ? "video" : "image",
          size: file.size,
          order: nextOrder + i,
          uploadedAt: new Date().toISOString(),
          caption: "",
        });
        setItems((prev) => [...prev, {
          id, url, storagePath, filename: file.name,
          type: isVideoFile(file.name) ? "video" : "image",
          size: file.size, order: nextOrder + i, uploadedAt: new Date(), caption: "",
        }]);
        successCount++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        progressMap[file.name] = { filename: file.name, progress: 0, status: "error", error: msg };
        setUploads(Object.values({ ...progressMap }));
        toast.error(`${file.name}: ${msg}`);
        failCount++;
      }
    }

    if (successCount > 0) toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded!`);
    setTimeout(() => setUploads([]), 4000);
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.filename}"?`)) return;
    try {
      await deleteMediaItem(item);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
    await reorderMediaItems(newItems);
  };

  const handleCaptionSave = async (id: string, caption: string) => {
    await updateMediaItem(id, { caption });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, caption } : i)));
    setEditingId(null);
    toast.success("Caption saved");
  };

  const handleSaveSettings = async () => {
    if (configForm.pin.length !== 4 || !/^\d{4}$/.test(configForm.pin)) {
      toast.error("PIN must be exactly 4 digits"); return;
    }
    setSaving(true);
    try {
      await upsertGalleryConfig(configForm);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "media", label: "Media",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
    },
    {
      id: "settings", label: "Settings",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.5"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5"/></svg>
    },
    {
      id: "qr", label: "QR Code",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M14 14H17M17 14V17M17 17H20M20 17V14M20 20H14V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#050508", position:"relative" }}>
      <div className="orb" style={{ width:400, height:400, background:"radial-gradient(circle, rgba(200,169,110,0.1) 0%, transparent 70%)", top:"-5%", right:"-5%", animationDuration:"30s" }} />

      {/* Top nav */}
      <div className="glass-dark" style={{ position:"sticky", top:0, zIndex:100, padding:"0 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", backdropFilter:"blur(30px)", WebkitBackdropFilter:"blur(30px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg, rgba(200,169,110,0.25) 0%, rgba(200,169,110,0.08) 100%)", border:"1px solid rgba(200,169,110,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" stroke="#c8a96e" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize:15, fontWeight:600, color:"#f5f5f7", letterSpacing:"-0.2px" }}>Admin</h1>
              <p style={{ fontSize:11, color:"rgba(245,245,247,0.35)" }}>{user?.email}</p>
            </div>
          </div>

          <div style={{ display:"flex", gap:2 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, transition:"all 0.2s ease", background: tab === t.id ? "rgba(200,169,110,0.15)" : "transparent", color: tab === t.id ? "#c8a96e" : "rgba(245,245,247,0.45)", letterSpacing:"0.1px" }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <a href="/gallery" target="_blank" style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(245,245,247,0.6)", fontSize:13, textDecoration:"none", transition:"all 0.2s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Preview
            </a>
            <button onClick={signOut} style={{ padding:"7px 14px", borderRadius:8, background:"transparent", border:"1px solid rgba(255,59,48,0.2)", color:"rgba(255,69,58,0.7)", fontSize:13, cursor:"pointer", transition:"all 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,48,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#ff453a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,69,58,0.7)"; }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px" }}>
        <AnimatePresence mode="wait">
          {/* MEDIA TAB */}
          {tab === "media" && (
            <motion.div key="media" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              {/* Stats row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:28 }}>
                {[
                  { label:"Total Items", value: items.length, icon:"🖼️" },
                  { label:"Images", value: items.filter(i => i.type === "image").length, icon:"📷" },
                  { label:"Videos", value: items.filter(i => i.type === "video").length, icon:"🎬" },
                  { label:"Total Size", value: formatFileSize(items.reduce((acc, i) => acc + (i.size || 0), 0)), icon:"💾" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-dark" style={{ borderRadius:16, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:22 }}>{stat.icon}</span>
                    <div>
                      <p style={{ fontSize:20, fontWeight:600, color:"#f5f5f7", lineHeight:1.2 }}>{stat.value}</p>
                      <p style={{ fontSize:12, color:"rgba(245,245,247,0.4)", letterSpacing:"0.2px" }}>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload zone */}
              <UploadZone onFiles={handleFiles} dragOver={dragOver} setDragOver={setDragOver} />

              {/* Upload limits info */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
                {[
                  { icon:"📷", label:"Images", detail:"up to 10 MB · JPG PNG WEBP HEIC" },
                  { icon:"🎬", label:"Videos", detail:"up to 100 MB · MP4 MOV WEBM" },
                  { icon:"☁️", label:"Direct upload", detail:"Videos go straight to Cloudinary — no server limit" },
                ].map((item) => (
                  <div key={item.label} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize:13 }}>{item.icon}</span>
                    <span style={{ fontSize:11, color:"rgba(245,245,247,0.35)", letterSpacing:"0.2px" }}>
                      <span style={{ color:"rgba(245,245,247,0.6)", fontWeight:500 }}>{item.label}</span> — {item.detail}
                    </span>
                  </div>
                ))}
              </div>

              {/* Upload progress */}
              <AnimatePresence>
                {uploads.length > 0 && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} style={{ overflow:"hidden", marginTop:12 }}>
                    <div className="glass-dark" style={{ borderRadius:16, padding:16, display:"flex", flexDirection:"column", gap:8 }}>
                      {uploads.map((u) => (
                        <div key={u.filename} style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background: u.status === "complete" ? "#30d158" : u.status === "error" ? "#ff453a" : "#c8a96e", flexShrink:0 }} />
                          <span style={{ fontSize:13, color:"rgba(245,245,247,0.6)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.filename}</span>
                          <div style={{ width:100, height:4, background:"rgba(255,255,255,0.1)", borderRadius:2, overflow:"hidden", flexShrink:0 }}>
                            <motion.div animate={{ width:`${u.progress}%` }} style={{ height:"100%", background: u.status === "error" ? "#ff453a" : "linear-gradient(90deg, #c8a96e, #f0d98e)", borderRadius:2, transition:"width 0.2s ease" }} />
                          </div>
                          <span style={{ fontSize:12, color:"rgba(245,245,247,0.4)", width:40, textAlign:"right", flexShrink:0 }}>{Math.round(u.progress)}%</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Media grid */}
              {loading ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:14, marginTop:24 }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shimmer" style={{ aspectRatio:"1", borderRadius:14, background:"rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(245,245,247,0.3)" }}>
                  <p style={{ fontSize:16 }}>No media yet. Upload some files above!</p>
                </div>
              ) : (
                <div style={{ marginTop:24 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <p style={{ fontSize:13, color:"rgba(245,245,247,0.4)", letterSpacing:"0.3px" }}>{items.length} items · Drag to reorder</p>
                  </div>
                  <div className="media-grid">
                    {items.map((item, index) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        index={index}
                        isEditing={editingId === item.id}
                        onEdit={() => setEditingId(item.id)}
                        onDelete={() => handleDelete(item)}
                        onCaptionSave={(caption) => handleCaptionSave(item.id, caption)}
                        onCancelEdit={() => setEditingId(null)}
                        onMoveUp={() => index > 0 && handleReorder(index, index - 1)}
                        onMoveDown={() => index < items.length - 1 && handleReorder(index, index + 1)}
                        total={items.length}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ maxWidth:560 }}>
              <h2 style={{ fontSize:20, fontWeight:600, color:"#f5f5f7", marginBottom:24, letterSpacing:"-0.3px" }}>Gallery Settings</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Title */}
                <div className="glass-dark" style={{ borderRadius:18, padding:20 }}>
                  <label style={{ fontSize:13, color:"rgba(245,245,247,0.45)", display:"block", marginBottom:10, letterSpacing:"0.3px" }}>Gallery Title</label>
                  <input value={configForm.title} onChange={(e) => setConfigForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="My Private Gallery"
                    style={{ width:"100%", padding:"12px 16px", borderRadius:11, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.08)", color:"#f5f5f7", fontSize:15, outline:"none" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,169,110,0.5)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  />
                </div>

                {/* PIN */}
                <div className="glass-dark" style={{ borderRadius:18, padding:20 }}>
                  <label style={{ fontSize:13, color:"rgba(245,245,247,0.45)", display:"block", marginBottom:6, letterSpacing:"0.3px" }}>Access PIN</label>
                  <p style={{ fontSize:12, color:"rgba(245,245,247,0.3)", marginBottom:10 }}>4-digit number required to enter gallery</p>
                  <input value={configForm.pin} onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) setConfigForm(f => ({ ...f, pin: e.target.value })); }}
                    type="tel" inputMode="numeric" maxLength={4} placeholder="1234"
                    style={{ width:120, padding:"12px 16px", borderRadius:11, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.08)", color:"#f5f5f7", fontSize:22, fontWeight:300, outline:"none", letterSpacing:6, textAlign:"center" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,169,110,0.5)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  />
                </div>

                {/* Slideshow interval */}
                <div className="glass-dark" style={{ borderRadius:18, padding:20 }}>
                  <label style={{ fontSize:13, color:"rgba(245,245,247,0.45)", display:"block", marginBottom:6, letterSpacing:"0.3px" }}>Slideshow Interval</label>
                  <p style={{ fontSize:12, color:"rgba(245,245,247,0.3)", marginBottom:12 }}>Duration each image is shown</p>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {[2000, 3000, 4000, 5000, 7000, 10000].map((ms) => (
                      <button key={ms} onClick={() => setConfigForm(f => ({ ...f, slideshowInterval: ms }))}
                        style={{ padding:"8px 16px", borderRadius:10, border: configForm.slideshowInterval === ms ? "1.5px solid #c8a96e" : "1.5px solid rgba(255,255,255,0.08)", background: configForm.slideshowInterval === ms ? "rgba(200,169,110,0.12)" : "rgba(255,255,255,0.04)", color: configForm.slideshowInterval === ms ? "#c8a96e" : "rgba(245,245,247,0.5)", fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>
                        {ms / 1000}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="glass-dark" style={{ borderRadius:18, padding:20 }}>
                  <label style={{ fontSize:13, color:"rgba(245,245,247,0.45)", display:"block", marginBottom:10, letterSpacing:"0.3px" }}>Description (optional)</label>
                  <textarea value={configForm.description} onChange={(e) => setConfigForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="A brief description of your gallery..."
                    rows={3}
                    style={{ width:"100%", padding:"12px 16px", borderRadius:11, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.08)", color:"#f5f5f7", fontSize:14, outline:"none", resize:"vertical", fontFamily:"inherit", lineHeight:1.5 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,169,110,0.5)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  />
                </div>

                {/* Save button */}
                <button onClick={handleSaveSettings} disabled={saving}
                  style={{ height:50, borderRadius:14, background:"linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)", border:"none", cursor:"pointer", color:"#050508", fontSize:15, fontWeight:600, letterSpacing:"0.2px", boxShadow:"0 8px 24px rgba(200,169,110,0.25)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {saving ? (
                    <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}
                      style={{ width:18, height:18, borderRadius:"50%", border:"2px solid rgba(5,5,8,0.3)", borderTopColor:"#050508" }} />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.5"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.5"/><polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.5"/></svg>
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* QR TAB */}
          {tab === "qr" && (
            <motion.div key="qr" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ maxWidth:500 }}>
              <h2 style={{ fontSize:20, fontWeight:600, color:"#f5f5f7", marginBottom:24, letterSpacing:"-0.3px" }}>QR Code & Sharing</h2>
              <div className="glass-dark" style={{ borderRadius:22, padding:32, display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
                <div style={{ borderRadius:20, overflow:"hidden", padding:16, background:"#fff", boxShadow:"0 20px 50px rgba(0,0,0,0.4)" }}>
                  <QRCode value={galleryUrl} size={220} bgColor="#ffffff" fgColor="#050508" qrStyle="dots" eyeRadius={10} />
                </div>
                <div style={{ textAlign:"center", width:"100%" }}>
                  <p style={{ fontSize:14, color:"rgba(245,245,247,0.7)", marginBottom:8 }}>Gallery URL</p>
                  <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <span style={{ fontSize:13, color:"rgba(245,245,247,0.5)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{galleryUrl}</span>
                    <button onClick={() => { navigator.clipboard.writeText(galleryUrl); toast.success("Copied!"); }}
                      style={{ background:"rgba(200,169,110,0.12)", border:"1px solid rgba(200,169,110,0.25)", borderRadius:8, padding:"6px 12px", cursor:"pointer", color:"#c8a96e", fontSize:12, flexShrink:0 }}>
                      Copy
                    </button>
                  </div>
                </div>
                <div style={{ width:"100%", padding:"16px 0", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize:13, color:"rgba(245,245,247,0.4)", textAlign:"center", lineHeight:1.6 }}>
                    Share this QR code with guests. They will need to scan it and enter the PIN <strong style={{ color:"#c8a96e" }}>{config?.pin}</strong> to access the gallery.
                  </p>
                </div>
                <button onClick={() => {
                  const canvas = document.querySelector("canvas");
                  if (canvas) {
                    const link = document.createElement("a");
                    link.download = "gallery-qr.png";
                    link.href = canvas.toDataURL();
                    link.click();
                    toast.success("QR Code downloaded!");
                  }
                }}
                  style={{ width:"100%", height:46, borderRadius:12, background:"linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)", border:"none", cursor:"pointer", color:"#050508", fontSize:14, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Download QR Code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
