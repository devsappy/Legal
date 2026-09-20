/** Locales, jurisdictions and the Acts they map to. Shared by frontend and backend. */
export const LOCALES = ["en", "hi", "mr", "ta"] as const;
export type Locale = (typeof LOCALES)[number];

export const LANGUAGES: { code: Locale; label: string; native: string; speech: string }[] = [
  { code: "en", label: "English", native: "English", speech: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", speech: "mr-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", speech: "ta-IN" },
];

export type Jurisdiction = { id: string; name: string; act: string; short: string };

export const JURISDICTIONS: Jurisdiction[] = [
  { id: "central", name: "Multi-State (Central)", act: "Multi-State Cooperative Societies Act, 2002", short: "MSCS Act 2002" },
  { id: "maharashtra", name: "Maharashtra", act: "Maharashtra Cooperative Societies Act, 1960", short: "MCS Act 1960" },
  { id: "gujarat", name: "Gujarat", act: "Gujarat Cooperative Societies Act, 1961", short: "GCS Act 1961" },
  { id: "karnataka", name: "Karnataka", act: "Karnataka Cooperative Societies Act, 1959", short: "KCS Act 1959" },
  { id: "tamil-nadu", name: "Tamil Nadu", act: "Tamil Nadu Cooperative Societies Act, 1983", short: "TNCS Act 1983" },
  { id: "west-bengal", name: "West Bengal", act: "West Bengal Cooperative Societies Act, 2006", short: "WBCS Act 2006" },
];

export const DEFAULT_JURISDICTION = "central";
