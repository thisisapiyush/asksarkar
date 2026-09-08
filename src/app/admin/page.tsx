"use client";

import { useState, useEffect, useRef } from "react";
import { Seal } from "@/components/seal";

interface Volume {
  id: string;
  titleEn: string;
  titleNe: string;
  category: string;
  status: string;
  sourceFilename: string | null;
  sampleQuestions: { en: string; ne: string; rom: string }[] | null;
  chunkCount: number;
  createdAt: string;
}

interface IngestStatus {
  volumeId: string;
  stage: "extracting" | "building" | "complete" | "error";
  error?: string;
  title?: string;
  titleNe?: string;
  sampleQuestions?: { en: string; ne: string; rom: string }[];
  chunkCount?: number;
}

const STAGES = ["extracting", "building", "complete"] as const;
const STAGE_LABELS: Record<string, string> = {
  extracting: "Reading document",
  building: "Building knowledge",
  complete: "Ready",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green/10 text-green",
  archived: "bg-rule text-ink-soft",
  error: "bg-sindoor/10 text-sindoor",
  processing: "bg-brass/10 text-brass",
};

export default function AdminPage() {
  const [vols, setVols] = useState<Volume[]>([]);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ingestId, setIngestId] = useState<string | null>(null);
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVolumes();
  }, []);

  useEffect(() => {
    if (!ingestId) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/ingest-status/${ingestId}`);
        const data: IngestStatus = await res.json();
        setStatus(data);
        if (data.stage === "complete" || data.stage === "error") {
          clearInterval(iv);
          fetchVolumes();
        }
      } catch {
        /* retry on next tick */
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [ingestId]);

  async function fetchVolumes() {
    try {
      const res = await fetch("/api/admin/volumes");
      if (res.ok) setVols(await res.json());
    } catch {
      /* ignore */
    }
  }

  async function handleUpload() {
    setUploading(true);
    setStatus(null);
    setIngestId(null);
    try {
      const form = new FormData();
      if (mode === "file" && file) {
        form.set("file", file);
      } else if (mode === "text" && text.trim()) {
        form.set("text", text);
      } else {
        return;
      }
      if (title.trim()) form.set("title", title);
      if (category.trim()) form.set("category", category);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (data.volumeId) {
        setIngestId(data.volumeId);
        setStatus({ volumeId: data.volumeId, stage: "extracting" });
        setTitle("");
        setCategory("");
        setText("");
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (e) {
      alert("Upload failed: " + String(e));
    } finally {
      setUploading(false);
    }
  }

  async function toggleArchive(vol: Volume) {
    const next = vol.status === "archived" ? "active" : "archived";
    await fetch(`/api/admin/volumes/${vol.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    fetchVolumes();
  }

  const stageIdx = status
    ? STAGES.indexOf(status.stage as (typeof STAGES)[number])
    : -1;

  const khand =
    "var(--font-khand), 'Mukta', system-ui, sans-serif" as const;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-ink text-paper shrink-0">
        <div className="max-w-[800px] mx-auto px-[18px] py-3 flex items-center gap-3">
          <div className="bg-paper rounded-full w-10 h-10 grid place-items-center shrink-0">
            <Seal />
          </div>
          <div className="flex-1">
            <div
              className="text-[25px] font-semibold tracking-wide leading-[1.05]"
              style={{ fontFamily: khand }}
            >
              Ask{" "}
              <span style={{ fontSize: "0.96em", position: "relative", top: "0.02em" }}>
                सरकार
              </span>
              <span className="text-[16px] text-[#A9B4C4] ml-2 font-normal">
                Admin
              </span>
            </div>
          </div>
          <a
            href="/"
            className="border border-[#3A4763] text-[#A9B4C4] rounded-[3px] px-2.5 py-[3px] text-[13px] hover:bg-[#1f2d44] transition-colors no-underline"
          >
            &larr; Back to desk
          </a>
        </div>
      </header>

      <main className="flex-1 bg-paper px-[18px] py-6">
        <div className="max-w-[800px] mx-auto space-y-6">
          {/* ── Upload card ── */}
          <div className="bg-card border border-rule rounded-[3px] p-5">
            <h2
              className="text-[22px] font-semibold text-ink mb-4"
              style={{ fontFamily: khand }}
            >
              Add knowledge
            </h2>

            <div className="flex gap-1 mb-4">
              {(["file", "text"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="px-3 py-1.5 text-[14px] rounded-[3px] border-none cursor-pointer transition-colors"
                  style={{
                    background:
                      mode === m ? "var(--color-sindoor)" : "var(--color-rule)",
                    color: mode === m ? "#fff" : "var(--color-ink-soft)",
                    fontWeight: mode === m ? 600 : 400,
                  }}
                >
                  {m === "file" ? "Upload file" : "Paste text"}
                </button>
              ))}
            </div>

            {mode === "file" ? (
              <div className="mb-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-[14px] text-ink"
                />
                <div className="text-[12px] text-ink-soft mt-1">
                  PDF, DOCX, or TXT
                </div>
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full procedure text here…"
                rows={8}
                className="w-full border border-rule rounded-[3px] bg-white px-3 py-2.5 text-[14px] text-ink resize-y mb-3 focus:outline-none focus:border-sindoor"
              />
            )}

            <div className="flex gap-3 mb-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (auto-generated if blank)"
                className="flex-1 border border-rule rounded-[3px] bg-white px-3 py-2 text-[14px] text-ink focus:outline-none focus:border-sindoor"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Service area (optional)"
                className="flex-1 border border-rule rounded-[3px] bg-white px-3 py-2 text-[14px] text-ink focus:outline-none focus:border-sindoor"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || (mode === "file" ? !file : !text.trim())}
              className="px-5 py-2 rounded-[3px] text-white font-semibold text-[15px] border-none cursor-pointer transition-colors disabled:opacity-50"
              style={{ background: "var(--color-sindoor)" }}
            >
              {uploading ? "Uploading…" : "Upload & Process"}
            </button>
          </div>

          {/* ── Pipeline status ── */}
          {status && (
            <div className="bg-card border border-rule rounded-[3px] p-5">
              {/* Stage indicator */}
              <div className="flex items-center gap-2 mb-4">
                {STAGES.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    {i > 0 && (
                      <div
                        className="w-8 h-[2px]"
                        style={{
                          background:
                            stageIdx >= i
                              ? "var(--color-green)"
                              : "var(--color-rule)",
                        }}
                      />
                    )}
                    <div
                      className={
                        stageIdx === i &&
                        status.stage !== "complete" &&
                        status.stage !== "error"
                          ? "animate-pulse-dot"
                          : ""
                      }
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background:
                          status.stage === "error" && stageIdx === i
                            ? "var(--color-sindoor)"
                            : stageIdx >= i
                              ? "var(--color-green)"
                              : "var(--color-rule)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="text-[13px]"
                      style={{
                        color:
                          stageIdx >= i
                            ? "var(--color-ink)"
                            : "var(--color-ink-soft)",
                        fontWeight: stageIdx === i ? 600 : 400,
                      }}
                    >
                      {STAGE_LABELS[s]}
                    </span>
                  </div>
                ))}
              </div>

              {status.stage === "error" && (
                <div className="text-sindoor text-[14px]">
                  Error: {status.error || "Unknown error"}
                </div>
              )}

              {status.stage === "complete" && (
                <div>
                  <div className="text-[16px] font-semibold text-ink mb-0.5">
                    {status.title}
                    {status.titleNe && (
                      <span className="text-ink-soft font-normal ml-2">
                        {status.titleNe}
                      </span>
                    )}
                  </div>
                  {status.chunkCount != null && (
                    <div className="text-[13px] text-ink-soft mb-3">
                      {status.chunkCount} chunk
                      {status.chunkCount !== 1 ? "s" : ""} indexed
                    </div>
                  )}
                  {status.sampleQuestions?.length ? (
                    <div>
                      <div className="text-[13px] text-ink-soft font-semibold mb-1.5">
                        Sample questions generated:
                      </div>
                      {status.sampleQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="text-[14px] text-ink mb-1 border-l-[3px] border-l-sindoor pl-3 py-1 bg-paper rounded-[3px]"
                        >
                          {q.en}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* ── Volume list ── */}
          <div>
            <h2
              className="text-[22px] font-semibold text-ink mb-3"
              style={{ fontFamily: khand }}
            >
              Knowledge base
            </h2>
            {vols.length === 0 ? (
              <div className="text-ink-soft text-[14px]">No volumes yet.</div>
            ) : (
              <div className="space-y-2">
                {vols.map((vol) => (
                  <div
                    key={vol.id}
                    className="bg-card border border-rule rounded-[3px] px-4 py-3 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[15px] font-semibold text-ink truncate">
                          {vol.titleEn}
                        </span>
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-sm font-semibold whitespace-nowrap ${STATUS_STYLE[vol.status] || STATUS_STYLE.processing}`}
                        >
                          {vol.status}
                        </span>
                      </div>
                      <div className="text-[13px] text-ink-soft">
                        {vol.titleNe} &middot; {vol.category} &middot;{" "}
                        {vol.chunkCount} chunk
                        {vol.chunkCount !== 1 ? "s" : ""}
                        {vol.sourceFilename && (
                          <> &middot; {vol.sourceFilename}</>
                        )}
                      </div>
                    </div>
                    {(vol.status === "active" ||
                      vol.status === "archived") && (
                      <button
                        onClick={() => toggleArchive(vol)}
                        className="text-[13px] px-2.5 py-1 border border-rule rounded-[3px] bg-transparent text-ink-soft hover:bg-paper cursor-pointer transition-colors shrink-0"
                      >
                        {vol.status === "active" ? "Archive" : "Restore"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
