"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { DEFAULT_JURISDICTION, JURISDICTIONS, JURISDICTION_STORAGE_KEY } from "@/lib/config";

type Ctx = {
  jurisdiction: string;
  setJurisdiction: (id: string) => void;
};

const JurisdictionContext = createContext<Ctx>({
  jurisdiction: DEFAULT_JURISDICTION,
  setJurisdiction: () => undefined,
});

const EVENT = "coop:jurisdiction";

function read(): string {
  try {
    const saved = localStorage.getItem(JURISDICTION_STORAGE_KEY);
    if (saved && JURISDICTIONS.some((j) => j.id === saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_JURISDICTION;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function JurisdictionProvider({ children }: { children: React.ReactNode }) {
  // Server renders the default; the client snapshot comes from localStorage.
  const jurisdiction = useSyncExternalStore(subscribe, read, () => DEFAULT_JURISDICTION);

  const setJurisdiction = (id: string) => {
    try {
      localStorage.setItem(JURISDICTION_STORAGE_KEY, id);
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <JurisdictionContext.Provider value={{ jurisdiction, setJurisdiction }}>
      {children}
    </JurisdictionContext.Provider>
  );
}

export function useJurisdiction() {
  return useContext(JurisdictionContext);
}
