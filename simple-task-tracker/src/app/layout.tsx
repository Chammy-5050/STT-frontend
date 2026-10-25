import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Inter } from "next/font/google";
import { AppProviders } from "../components/providers";
import AuthProvider from "@/components/auth/AuthProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme-key";
import "./globals.css";
import "./app.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Task Tracker", template: "%s | Task Tracker" },
  description: "Plan projects, track tasks and meet deadlines with your team.",
};

// Applies the saved (or system) theme before first paint to avoid a light flash.
const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider><AppProviders>{children}</AppProviders></AuthProvider>
      </body>
    </html>
  );
}
