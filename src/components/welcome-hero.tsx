import { SegmentRing } from "@/components/cycle-ring";

/** Landing illustration: the Nocturna cycle ring with the breathing Savia orb. */
export function WelcomeHero() {
  return (
    <div className="mt-10">
      <SegmentRing cycleLength={28} periodLength={5} cycleDay={11} label="" decorative>
        <span className="orb size-24 rounded-full" />
      </SegmentRing>
    </div>
  );
}
