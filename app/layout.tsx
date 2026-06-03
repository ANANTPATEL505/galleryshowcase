import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Private Gallery",
  description: "Your exclusive private photo and video gallery",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(20,20,28,0.95)",
                color: "#f5f5f7",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                padding: "12px 16px",
              },
              success: { iconTheme: { primary: "#30d158", secondary: "#000" } },
              error: { iconTheme: { primary: "#ff453a", secondary: "#000" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
