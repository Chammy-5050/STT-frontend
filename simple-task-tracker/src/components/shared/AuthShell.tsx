"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { authCardVariants } from "@/lib/motion";

export function AuthMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
    >
      <rect
        x="8"
        y="19"
        width="24"
        height="8"
        rx="4"
        transform="rotate(45 8 19)"
        fill="currentColor"
      />
      <circle cx="31.5" cy="15.5" r="4.5" fill="currentColor" />
      <circle cx="39" cy="8" r="3.5" fill="currentColor" />
    </svg>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="flex min-h-svh items-center justify-center bg-auth-page p-0 sm:p-4 md:p-6">
      <motion.div
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={authCardVariants}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
        className="flex min-h-svh w-full max-w-7xl flex-col overflow-hidden bg-white shadow-sm sm:rounded-3xl md:min-h-[620px] md:flex-row"
      >
        <aside
          aria-label="Task Tracker brand"
          className="auth-brand-panel relative hidden min-h-full items-center justify-center rounded-l-3xl text-white md:flex md:w-[45%]"
        >
          <div className="relative z-10 flex flex-col items-center gap-2">
            <AuthMark className="size-24 text-white/90" />
            <span className="text-center text-4xl font-bold tracking-tight text-white/95">
              Task Tracker
            </span>
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 items-center justify-center px-4 py-8 sm:px-8 md:w-[55%] md:px-10 lg:px-14">
          <div className="w-full max-w-[400px] rounded-[20px] bg-auth-lavender p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-white text-auth-primary shadow-sm">
                <AuthMark className="size-7" />
              </div>
            </div>
            {children}
          </div>
        </section>
      </motion.div>
    </main>
  );
}
