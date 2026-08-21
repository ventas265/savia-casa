export function Photo({
  src,
  alt,
  className,
}: {
  src: "/photos/te.jpg" | "/photos/cama.jpg" | "/photos/manos.jpg" | "/photos/savia-ia.jpg" | "/photos/savia-ia-hero.jpg";
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className ?? "h-40 w-full rounded-[1.5rem] object-cover shadow-card"}
    />
  );
}
