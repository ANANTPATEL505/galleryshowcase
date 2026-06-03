"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="orb"
        style={{
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(200,169,110,0.1) 0%, transparent 70%)",
          top: "10%",
          left: "20%",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          padding: "0 24px",
        }}
      >
        <p
          style={{
            fontSize: 96,
            fontWeight: 700,
            background:
              "linear-gradient(135deg, rgba(200,169,110,0.6) 0%, rgba(200,169,110,0.2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-4px",
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          404
        </p>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#f5f5f7",
            marginBottom: 10,
            letterSpacing: "-0.3px",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(245,245,247,0.4)",
            marginBottom: 36,
          }}
        >
          The page you're looking for doesn't exist.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/")}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #c8a96e 0%, #a8894e 100%)",
              border: "none",
              color: "#050508",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(200,169,110,0.25)",
            }}
          >
            Back to Home
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.back()}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(245,245,247,0.7)",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
