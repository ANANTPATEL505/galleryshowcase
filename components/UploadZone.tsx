"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
}

export default function UploadZone({ onFiles, dragOver, setDragOver }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles, setDragOver]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={dragOver ? "dropzone-active" : ""}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
      style={{
        border: `2px dashed ${dragOver ? "#c8a96e" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 20,
        padding: "44px 32px",
        textAlign: "center",
        cursor: "pointer",
        background: dragOver ? "rgba(200,169,110,0.06)" : "rgba(255,255,255,0.02)",
        transition: "all 0.25s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated corner accents when dragging */}
      {dragOver && (
        <>
          {[
            { top: 12, left: 12, borderTop: "2px solid #c8a96e", borderLeft: "2px solid #c8a96e" },
            { top: 12, right: 12, borderTop: "2px solid #c8a96e", borderRight: "2px solid #c8a96e" },
            { bottom: 12, left: 12, borderBottom: "2px solid #c8a96e", borderLeft: "2px solid #c8a96e" },
            { bottom: 12, right: 12, borderBottom: "2px solid #c8a96e", borderRight: "2px solid #c8a96e" },
          ].map((style, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              style={{ position: "absolute", width: 20, height: 20, borderRadius: 3, ...style }} />
          ))}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <motion.div animate={dragOver ? { y: -4 } : { y: 0 }} transition={{ duration: 0.2 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: dragOver ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${dragOver ? "rgba(200,169,110,0.4)" : "rgba(255,255,255,0.1)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            transition: "all 0.25s ease",
          }}
        >
          {dragOver ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L12 15M12 2L8 6M12 2L16 6" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="rgba(245,245,247,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              <polyline points="17 8 12 3 7 8" stroke="rgba(245,245,247,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="rgba(245,245,247,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        <p style={{ fontSize: 16, fontWeight: 500, color: dragOver ? "#c8a96e" : "rgba(245,245,247,0.7)", marginBottom: 6, transition: "color 0.2s" }}>
          {dragOver ? "Drop files here" : "Upload photos & videos"}
        </p>
        <p style={{ fontSize: 13, color: "rgba(245,245,247,0.3)", marginBottom: 16 }}>
          Drag & drop or click to browse
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {["JPG", "PNG", "HEIC", "MP4", "MOV"].map((fmt) => (
            <span key={fmt} style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(245,245,247,0.4)", letterSpacing: "0.5px" }}>
              {fmt}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
