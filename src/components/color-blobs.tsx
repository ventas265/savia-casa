export function ColorBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="blob -top-16 right-[-22%] h-64 w-64 bg-[#ff6b9d]/70" />
      <div className="blob top-44 left-[-30%] h-72 w-72 bg-[#7ee8d8]/60" style={{ animationDelay: "-4s" }} />
      <div className="blob bottom-32 right-[-14%] h-56 w-56 bg-[#ffd56a]/70" style={{ animationDelay: "-7s" }} />
      <div className="blob top-[28rem] left-[20%] h-28 w-28 bg-[#c9b6ff]/80" style={{ animationDelay: "-2s" }} />
    </div>
  );
}

export function PageTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div>
      {kicker ? <p className="text-sm font-semibold text-muted">{kicker}</p> : null}
      <h1 className="bg-gradient-to-br from-[#ff2d6a] via-[#ff6b4a] to-[#c45bff] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
        {title}
      </h1>
    </div>
  );
}

export const CHIP_TONES = [
  "bg-[#ff6b9d] text-white",
  "bg-[#5ee4d6] text-ink",
  "bg-[#ffd56a] text-ink",
  "bg-[#c9b6ff] text-ink",
  "bg-[#ff9eb5] text-ink",
  "bg-ink text-primary-fg",
];
