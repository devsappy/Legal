/*
 * Loads apps/backend/.env into process.env before anything reads it.
 * Imported first by server.ts; a missing file is fine (Docker/CI pass real env vars).
 * Values already set in the environment win over the file.
 */
try {
  process.loadEnvFile(".env");
} catch {
  /* no .env file */
}
