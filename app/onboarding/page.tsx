"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { InterviewChat } from "@/components/onboarding/interview-chat";

export default function OnboardingPage() {
  const [started, setStarted] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!started ? (
        <motion.div
          key="welcome"
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center px-6"
          exit={{ opacity: 0, scale: 0.95 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-text-primary mb-3">
              Let&apos;s discover your brand
            </h1>
            <p className="text-text-secondary mb-8 leading-relaxed">
              I&apos;ll ask you 5 quick questions about your business. In under
              2 minutes, I&apos;ll generate your complete Brand DNA — your
              niche, voice, positioning, and everything you need to create
              content that sounds like you.
            </p>

            <button
              className="ck-btn-primary !px-8 !py-3 !rounded-xl shadow-lg shadow-accent/25"
              onClick={() => setStarted(true)}
            >
              Start the conversation
            </button>

            <p className="mt-4 text-xs text-text-tertiary">
              Takes about 2 minutes
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <InterviewChat />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
