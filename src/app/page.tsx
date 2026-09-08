"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Seal } from "@/components/seal";

type Lang = "en" | "ne" | "rom";

interface Source {
  id: string;
  titleEn: string;
  titleNe: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

const UI: Record<Lang, Record<string, string>> = {
  en: {
    tagline: "What papers do I need? Ask before you travel.",
    admin: "Admin",
    welcome: "The help desk is open.",
    welcomeSub:
      "Ask in Nepali or English. You’ll get the document list, the office, the fee and the waiting time — in whichever language you picked above.",
    starters: "Common questions",
    thinking: "Checking the files…",
    placeholder: "Type your question…",
    send: "Ask",
    clear: "Clear conversation",
    failed: "Something went wrong. Please try again.",
    sources: "Sources",
    limit:
      "You’ve reached the question limit for this session. Please refresh to start a new one.",
  },
  ne: {
    tagline: "कुन कागजात चाहिन्छ? जानु अघि सोध्नुहोस्।",
    admin: "प्रशासन",
    welcome: "सहायता कक्ष खुल्ला छ।",
    welcomeSub:
      "नेपाली वा अंग्रेजीमा सोध्नुहोस्। कागजातको सूची, कार्यालय, शुल्क र समय — तपाईंले छान्नुभएको भाषामा।",
    starters: "सामान्य प्रश्नहरू",
    thinking: "फाइल हेर्दैछ…",
    placeholder: "आफ्नो प्रश्न टाइप गर्नुहोस्…",
    send: "सोध्नुहोस्",
    clear: "कुराकानी मेटाउनुहोस्",
    failed: "केही गल्ती भयो। फेरि प्रयास गर्नुहोस्।",
    sources: "स्रोतहरू",
    limit:
      "यो सत्रको प्रश्न सीमा पुगिसकेको छ। नयाँ सत्र सुरु गर्नुहोस्।",
  },
  rom: {
    tagline: "Kun kagajat chahincha? Janu aghi sodhnuhos.",
    admin: "Admin",
    welcome: "Help desk khulla chha.",
    welcomeSub:
      "Nepali ya English ma sodhnuhos. Kagajat ko suchi, karyalaya, shulka ra samaya — tapai le chhannubhaeko bhasha ma.",
    starters: "Samanya prashnaharu",
    thinking: "File herdai chha…",
    placeholder: "Aafno prashna type garnuhos…",
    send: "Sodhnuhos",
    clear: "Kurakani metaunuhos",
    failed: "Kehi galti bhayo. Pheri prayaas garnuhos.",
    sources: "Srot-haru",
    limit:
      "Yo satra ko prashna seema pugisakeko chha. Naya satra suru garnuhos.",
  },
};

const DEFAULT_STARTERS: Record<Lang, string>[] = [
  {
    en: "What do I need for a citizenship certificate?",
    ne: "नागरिकता प्रमाणपत्रका लागि के के चाहिन्छ?",
    rom: "Nagarikta pramanpatra ko lagi ke ke chahincha?",
  },
  {
    en: "How much does a passport cost and how long does it take?",
    ne: "राहदानीको दस्तुर कति र कति दिन लाग्छ?",
    rom: "Rahadani ko dastur kati ho ra kati din lagcha?",
  },
  {
    en: "My baby was born last week. What do I do?",
    ne: "गत हप्ता बच्चा जन्मियो। अब के गर्ने?",
    rom: "Gata hapta baccha janmiyo. Aba ke garne?",
  },
  {
    en: "I want to buy land. What papers does the seller need?",
    ne: "जग्गा किन्न लागेको छु। बेच्नेले के कागज ल्याउनुपर्छ?",
    rom: "Jagga kinna lageko chu. Bechne le ke kagaj lyaunuparcha?",
  },
];

function Rich({ text }: { text: string }) {
  const lines = String(text).split("\n");
  return (
    <div className="text-[15px] leading-relaxed text-ink">
      {lines.map((ln, i) => {
        const t = ln.trim();
        if (!t) return <div key={i} style={{ height: 8 }} />;
        const bullet = /^[-•*]\s+/.test(t);
        const body = bullet ? t.replace(/^[-•*]\s+/, "") : t;
        const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} className="text-ink font-bold">
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{p}</span>
          )
        );
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 ml-1 mb-0.5">
              <span className="text-sindoor mt-[2px] select-none">&bull;</span>
              <span>{parts}</span>
            </div>
          );
        }
        return (
          <p key={i} className="mb-1">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const [starters, setStarters] = useState(DEFAULT_STARTERS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = UI[lang];

  useEffect(() => {
    fetch("/api/starters")
      .then((r) => r.json())
      .then((q: Record<Lang, string>[]) => {
        if (q.length) {
          const seen = new Set<string>();
          const merged: Record<Lang, string>[] = [];
          for (const item of [...q, ...DEFAULT_STARTERS]) {
            if (!seen.has(item.en) && merged.length < 4) {
              seen.add(item.en);
              merged.push(item);
            }
          }
          setStarters(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const ask = useCallback(
    async (question: string) => {
      if (!question.trim() || busy) return;
      setInput("");
      setBusy(true);

      const userMsg: Message = { role: "user", content: question };
      const assistantMsg: Message = {
        role: "assistant",
        content: "",
        sources: [],
      };

      setMsgs((prev) => [...prev, userMsg, assistantMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            lang,
            sessionId,
            history: msgs
              .slice(-6)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: t.failed }));
          setMsgs((prev) => {
            const u = [...prev];
            u[u.length - 1] = {
              role: "assistant",
              content: err.error || t.failed,
            };
            return u;
          });
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let sources: Source[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop()!;
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "sources") {
                sources = data.volumes;
                setMsgs((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = { ...u[u.length - 1], sources };
                  return u;
                });
              } else if (data.type === "token") {
                fullText += data.text;
                const snapshot = fullText;
                setMsgs((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = {
                    ...u[u.length - 1],
                    content: snapshot,
                  };
                  return u;
                });
              } else if (data.type === "error") {
                setMsgs((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = {
                    ...u[u.length - 1],
                    content: data.message || t.failed,
                  };
                  return u;
                });
              }
            } catch {
              /* skip malformed SSE line */
            }
          }
        }
      } catch {
        setMsgs((prev) => {
          const u = [...prev];
          if (u.length > 0) {
            u[u.length - 1] = {
              ...u[u.length - 1],
              content: t.failed,
            };
          }
          return u;
        });
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, lang, sessionId, msgs, t]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-ink text-paper shrink-0">
        <div className="max-w-[700px] mx-auto px-[18px] py-3">
          <div className="flex items-center gap-3">
            <div className="bg-paper rounded-full w-10 h-10 grid place-items-center shrink-0">
              <Seal />
            </div>
            <div className="flex-1 min-w-[150px]">
              <div
                className="text-[25px] font-semibold tracking-wide leading-[1.05]"
                style={{
                  fontFamily:
                    "var(--font-khand), 'Mukta', system-ui, sans-serif",
                }}
              >
                Ask{" "}
                <span
                  style={{
                    fontSize: "0.96em",
                    position: "relative",
                    top: "0.02em",
                  }}
                >
                  सरकार
                </span>
              </div>
              <div className="text-[12.5px] text-[#A9B4C4] leading-snug">
                {t.tagline}
              </div>
            </div>
            <a
              href="/admin"
              className="border border-[#3A4763] text-[#A9B4C4] rounded-[3px] px-2.5 py-[3px] text-[13px] hover:bg-[#1f2d44] transition-colors no-underline"
            >
              {t.admin}
            </a>
          </div>

          {/* Language pills */}
          <div className="flex mt-2.5 rounded-[3px] overflow-hidden border border-[#3A4763]">
            {(["en", "ne", "rom"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="flex-1 py-[7px] px-1 text-[13.5px] transition-colors border-none cursor-pointer"
                style={{
                  background:
                    lang === l ? "var(--color-sindoor)" : "transparent",
                  color: lang === l ? "#fff" : "#A9B4C4",
                  fontWeight: lang === l ? 600 : 400,
                }}
              >
                {l === "en"
                  ? "English"
                  : l === "ne"
                    ? "नेपाली"
                    : "Nepali (Roman)"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-[18px] py-6"
        style={{
          backgroundColor: "var(--color-paper)",
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 31px, var(--color-rule) 31px 32px)",
        }}
      >
        <div className="max-w-[700px] mx-auto">
          {msgs.length === 0 ? (
            <>
              <h2
                className="text-[30px] font-semibold leading-tight mb-2 text-ink"
                style={{
                  fontFamily:
                    "var(--font-khand), 'Mukta', system-ui, sans-serif",
                }}
              >
                {t.welcome}
              </h2>
              <p className="text-ink-soft leading-relaxed max-w-[62ch] mb-6">
                {t.welcomeSub}
              </p>
              <div className="text-[13px] text-ink-soft mb-2.5 font-semibold tracking-wide uppercase">
                {t.starters}
              </div>
              <div className="flex flex-col gap-2">
                {starters.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => ask(s[lang])}
                    disabled={busy}
                    className="bg-card border border-rule border-l-[3px] border-l-sindoor rounded-[3px] px-3.5 py-2.5 text-left text-[15px] text-ink hover:bg-[#F5F6F2] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {s[lang]}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {msgs.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="bg-ink text-[#F2F4F1] rounded-[3px_3px_3px_12px] px-3.5 py-2.5 max-w-[85%] text-[15px] whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="relative bg-card border border-rule border-l-[3px] border-l-sindoor rounded-[3px] px-4 py-4 max-w-[95%] overflow-hidden"
                  >
                    {msg.sources && msg.sources.length > 0 && (
                      <div
                        className="absolute pointer-events-none select-none"
                        style={{
                          right: -6,
                          top: 8,
                          opacity: 0.09,
                          transform: "rotate(-14deg)",
                          width: 96,
                        }}
                      >
                        <Seal />
                      </div>
                    )}

                    {msg.content ? (
                      <Rich text={msg.content} />
                    ) : (
                      <div className="flex items-center gap-2 text-ink-soft text-sm">
                        <span className="w-2 h-2 rounded-full bg-sindoor animate-pulse-dot" />
                        {t.thinking}
                      </div>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-dashed border-rule">
                        <div className="text-[12px] text-ink-soft font-semibold mb-1.5">
                          {t.sources}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((s) => (
                            <span
                              key={s.id}
                              className="text-[12px] text-sindoor border border-sindoor/30 rounded-[3px] px-2 py-0.5"
                            >
                              {lang === "ne" ? s.titleNe : s.titleEn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>

      {/* Input area */}
      <div className="border-t border-rule bg-card shrink-0">
        <div className="max-w-[700px] mx-auto px-[18px] py-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              rows={1}
              disabled={busy}
              className="flex-1 border border-rule rounded-[3px] bg-white px-3 py-2.5 text-[15.5px] text-ink resize-none focus:outline-none focus:border-sindoor disabled:opacity-50"
              style={{ minHeight: 44 }}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="px-4 rounded-[3px] text-white font-semibold text-[15px] shrink-0 transition-colors border-none cursor-pointer"
              style={{
                height: 44,
                background:
                  busy || !input.trim()
                    ? "var(--color-rule)"
                    : "var(--color-sindoor)",
              }}
            >
              {t.send}
            </button>
          </form>
          {msgs.length > 0 && (
            <button
              onClick={() => setMsgs([])}
              className="text-[13px] text-ink-soft mt-1.5 hover:text-sindoor transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              {t.clear}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-ink text-[#7E8CA3] text-[11.5px] text-center py-1.5 px-3 shrink-0">
        Demo data. Not real government procedure — replace before any public
        use.
      </footer>
    </div>
  );
}
