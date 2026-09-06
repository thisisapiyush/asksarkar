import { Seal } from "@/components/seal";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-ink text-paper px-[18px] py-3 shrink-0">
        <div className="max-w-[700px] mx-auto flex items-center gap-3">
          <div className="bg-paper rounded-full w-10 h-10 grid place-items-center shrink-0">
            <Seal />
          </div>
          <div className="flex-1 min-w-[150px]">
            <div
              className="text-[25px] font-semibold tracking-wide leading-tight"
              style={{
                fontFamily:
                  "var(--font-khand), 'Mukta', system-ui, sans-serif",
              }}
            >
              Ask Sarkar
            </div>
            <div className="text-[12.5px] text-[#A9B4C4] leading-snug">
              What papers do I need? Ask before you travel.
            </div>
          </div>
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto px-[18px] py-6"
        style={{
          backgroundColor: "var(--color-paper)",
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, var(--color-rule) 31px 32px)`,
        }}
      >
        <div className="max-w-[700px] mx-auto">
          <h2
            className="text-[30px] font-semibold leading-tight mb-2 text-ink"
            style={{
              fontFamily:
                "var(--font-khand), 'Mukta', system-ui, sans-serif",
            }}
          >
            The desk is open.
          </h2>
          <p className="text-ink-soft leading-relaxed max-w-[62ch] mb-6">
            Ask in Nepali or English. You&apos;ll get the document list, the
            office, the fee and the waiting time — in whichever language you
            picked above.
          </p>
          <div className="bg-card border border-rule rounded-sm p-4 text-ink-soft text-sm">
            Milestone 1 complete — skeleton, schema, and seed data verified.
            Chat UI ships in milestone 2.
          </div>
        </div>
      </main>

      <footer className="bg-ink text-[#7E8CA3] text-[11.5px] text-center py-1.5 px-3 shrink-0">
        Demo data. Not real government procedure — replace before any public
        use.
      </footer>
    </div>
  );
}
