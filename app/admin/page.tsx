"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { motion, AnimatePresence } from "framer-motion";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#050508", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}
          style={{ width:32, height:32, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.1)", borderTopColor:"#c8a96e" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#050508" }}>
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div key="dashboard" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <AdminDashboard />
          </motion.div>
        ) : (
          <motion.div key="login" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <AdminLogin />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
