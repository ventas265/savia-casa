/** Little parrot stickers — the spark her wife asked for. */
export function Periquito({ className = "size-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <ellipse cx="40" cy="72" rx="18" ry="4" fill="#e4577a" opacity="0.18" />
      <path d="M28 44c-8 4-14 14-8 22 8 10 26 8 34-2 8-10 6-24-4-30-6-4-14-2-22 10Z" fill="#2aa8a3" />
      <path d="M36 28c8-14 24-10 26 4 2 10-4 16-14 18-12 2-20-6-12-22Z" fill="#e4577a" />
      <path d="M42 22c6-10 16-6 14 4-1 6-8 10-14 8-6-2-6-8 0-12Z" fill="#ffb3c7" />
      <circle cx="48" cy="30" r="3.2" fill="#2b2423" />
      <circle cx="49.2" cy="29" r="1.1" fill="#fff" />
      <path d="M58 32l10 2-10 4c-1-2-1-4 0-6Z" fill="#ffc85c" />
      <path d="M22 50c-8-2-14 8-8 14 4 4 12 2 14-4 2-6 0-9-6-10Z" fill="#7ec8d1" />
    </svg>
  );
}

export function Flor({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="6" fill="#ffc85c" />
      <circle cx="24" cy="10" r="7" fill="#e4577a" />
      <circle cx="24" cy="38" r="7" fill="#ff8fab" />
      <circle cx="10" cy="24" r="7" fill="#c9b6ff" />
      <circle cx="38" cy="24" r="7" fill="#7ee0c8" />
    </svg>
  );
}

export function HeartLeaf({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 28s-12-7.5-12-15C4 8 8 5 12 7c2 1 4 3 4 3s2-2 4-3c4-2 8 1 8 6 0 7.5-12 15-12 15Z"
        fill="#e4577a"
      />
    </svg>
  );
}
