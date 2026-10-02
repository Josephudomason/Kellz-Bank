"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

const INTRO_STORAGE_KEY = "kellz-intro-complete";
const INTRO_COMPLETE_EVENT = "kellz-intro-complete-change";
let introFinishedInMemory = false;

function subscribeToIntro(listener: () => void) {
  window.addEventListener(INTRO_COMPLETE_EVENT, listener);
  return () => window.removeEventListener(INTRO_COMPLETE_EVENT, listener);
}

function getIntroCompleteSnapshot() {
  try {
    return introFinishedInMemory || window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return introFinishedInMemory;
  }
}

function getServerIntroSnapshot() {
  return false;
}

export default function IntroVideoGate({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const introComplete = useSyncExternalStore(subscribeToIntro, getIntroCompleteSnapshot, getServerIntroSnapshot);
  const phase = introComplete || prefersReducedMotion === true ? "done" : "playing";
  const [playBlocked, setPlayBlocked] = useState(false);

  const finishIntro = useCallback(() => {
    introFinishedInMemory = true;
    try {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    } catch {
      // Continue without session persistence when storage is unavailable.
    }
    window.dispatchEvent(new Event(INTRO_COMPLETE_EVENT));
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const video = videoRef.current;
    if (!video) return;

    void video.play().catch(() => setPlayBlocked(true));
  }, [phase]);

  async function playIntro() {
    try {
      await videoRef.current?.play();
      setPlayBlocked(false);
    } catch {
      setPlayBlocked(true);
    }
  }

  return (
    <>
      <div aria-hidden={phase !== "done"} inert={phase !== "done"}>
        {children}
      </div>
      <AnimatePresence>
        {phase !== "done" && (
          <motion.section
            key="kellz-intro"
            role="dialog"
            aria-modal="true"
            aria-label="Kellz introduction"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="fixed inset-0 z-[100] overflow-hidden bg-[#07100d] text-white"
          >
            {phase === "playing" && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={finishIntro}
                onError={finishIntro}
                onPlay={() => setPlayBlocked(false)}
                className="absolute inset-0 size-full object-cover"
              >
                <source src="/Kellztheme.mp4" type="video/mp4" />
              </video>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase text-white/80">Kellz</p>
              <div className="flex items-center gap-3">
                {playBlocked && (
                  <button
                    type="button"
                    onClick={playIntro}
                    className="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Play intro
                  </button>
                )}
                <button
                  type="button"
                  onClick={finishIntro}
                  className="rounded-md border border-white/40 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Skip intro
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}