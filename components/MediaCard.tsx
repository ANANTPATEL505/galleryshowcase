"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaItem } from "@/types";
import { formatFileSize } from "@/lib/utils";

interface MediaCardProps {
  item: MediaItem;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCaptionSave: (caption: string) => void;
  onCancelEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  total: number;
}

export default function MediaCard({
  item, index, isEditing, onEdit, onDelete, onCaptionSave, onCancelEdit, onMoveUp, onMoveDown, total
}: MediaCardProps) {
  const [caption, setCaption] = useState(item.caption || "");
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMenu(false); }}
      style={{
        position: "relative",
        aspectRatio: "1",
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(10,10,15,0.8)",
        border: "1px solid rgba(255,255,255,0.07)",
        cursor: "default",
      }}
    >
      {/* Media */}
      {item.type === "image" ? (
        <img
          src={item.url}
          alt={item.caption || item.filename}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        />
      ) : (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(200,169,110,0.3)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#c8a96e"><path d="M5 3L19 12L5 21V3Z"/></svg>
            </div>
          </div>
          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 5, padding: "2px 7px", fontSize: 10, color: "#c8a96e", letterSpacing: "0.5px", fontWeight: 600 }}>VIDEO</div>
        </div>
      )}

      {/* Order badge */}
      <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(5,5,8,0.75)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "2px 7px", fontSize: 11, color: "rgba(245,245,247,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>
        #{index + 1}
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.4) 50%, transparent 100%)" }}
          >
            {/* Info */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 10px 10px" }}>
              <p style={{ fontSize: 11, color: "rgba(245,245,247,0.8)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                {item.caption || item.filename}
              </p>
              <p style={{ fontSize: 10, color: "rgba(245,245,247,0.35)" }}>{formatFileSize(item.size)}</p>
            </div>

            {/* Action buttons */}
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
              {/* Move up */}
              {index > 0 && (
                <button onClick={onMoveUp} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(10,10,15,0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,245,247,0.7)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              )}
              {/* Move down */}
              {index < total - 1 && (
                <button onClick={onMoveDown} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(10,10,15,0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,245,247,0.7)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>

            {/* Edit / Delete */}
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
              <button onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(200,169,110,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(200,169,110,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
              <button onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,69,58,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,69,58,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#ff453a" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit caption modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.95)", backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 12, gap: 8 }}
          >
            <p style={{ fontSize: 11, color: "rgba(245,245,247,0.5)", letterSpacing: "0.3px" }}>Caption</p>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") onCaptionSave(caption); if (e.key === "Escape") onCancelEdit(); }}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#f5f5f7", fontSize: 13, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onCaptionSave(caption)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "rgba(200,169,110,0.2)", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Save</button>
              <button onClick={onCancelEdit} style={{ flex: 1, padding: "7px 0", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,245,247,0.5)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
