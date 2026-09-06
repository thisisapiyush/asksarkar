export default function AdminPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-ink text-paper px-[18px] py-3 shrink-0">
        <div className="max-w-[700px] mx-auto">
          <div
            className="text-[25px] font-semibold tracking-wide leading-tight"
            style={{
              fontFamily:
                "var(--font-khand), 'Mukta', system-ui, sans-serif",
            }}
          >
            Ask Sarkar — Office Desk
          </div>
          <div className="text-[12.5px] text-[#A9B4C4] leading-snug">
            Knowledge volumes and ingestion
          </div>
        </div>
      </header>

      <main className="flex-1 bg-paper px-[18px] py-6">
        <div className="max-w-[700px] mx-auto">
          <div className="bg-card border border-rule border-t-[3px] border-t-brass rounded-sm p-4">
            <p className="text-ink-soft text-sm">
              Admin panel placeholder — volume management ships in milestone 4.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
