import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { JURISDICTIONS } from "@/lib/config";

export const runtime = "nodejs";
const run = promisify(execFile);

/**
 * Upload an Act. Markdown/text is stored as-is under corpus/<jurisdiction>/;
 * a PDF is kept under corpus/_sources/ and converted with scripts/ingest.mjs.
 * The corpus loader picks the new file up on the next request.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const form = await req.formData();
  const file = form.get("file");
  const jurisdiction = String(form.get("jurisdiction") ?? "");
  const title = String(form.get("title") ?? "").trim();
  if (!(file instanceof File) || !JURISDICTIONS.some((j) => j.id === jurisdiction) || title.length < 3) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const ext = path.extname(file.name).toLowerCase();
  if (![".pdf", ".md", ".txt"].includes(ext)) return NextResponse.json({ ok: false, error: "type" }, { status: 400 });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "act";
  const bytes = Buffer.from(await file.arrayBuffer());
  const root = process.cwd();

  if (ext === ".pdf") {
    const src = path.join(root, "corpus", "_sources", `${slug}.pdf`);
    await fs.mkdir(path.dirname(src), { recursive: true });
    await fs.writeFile(src, bytes);
    try {
      const { stdout } = await run(process.execPath, [path.join(root, "scripts", "ingest.mjs"), src, jurisdiction, title, "--out", `${slug}.md`], {
        cwd: root,
        timeout: 120_000,
      });
      const m = /^(\d+) sections/.exec(stdout);
      return NextResponse.json({ ok: true, file: `corpus/${jurisdiction}/${slug}.md`, sections: m ? Number(m[1]) : null });
    } catch (err) {
      return NextResponse.json({ ok: false, error: "ingest", detail: (err as Error).message.slice(0, 300) }, { status: 500 });
    }
  }

  const dest = path.join(root, "corpus", jurisdiction, `${slug}.md`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  let text = bytes.toString("utf8");
  if (!/^#\s+/m.test(text)) text = `# ${title}\n\n${text}`;
  await fs.writeFile(dest, text, "utf8");
  return NextResponse.json({ ok: true, file: `corpus/${jurisdiction}/${slug}.md`, sections: (text.match(/^##\s+/gm) ?? []).length });
}
