export type Stage = "cycle" | "pregnancy" | "postpartum" | "peri" | "meno";
export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal" | "none";
export type Flow = "none" | "spotting" | "light" | "medium" | "heavy";
export type Intention = "track" | "avoid" | "ttc";
export type Mucus = "none" | "sticky" | "creamy" | "eggwhite" | "watery";
export type SexKind = "none" | "protected" | "unprotected" | "withdrawal";

export type SaviaProfile = {
  userId: string;
  displayName: string;
  stage: Stage;
  birthYear: number | null;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
  dueDate: string | null;
  lastPeriodYear: number | null;
  onboardingDone: boolean;
  locale: string;
  plan: string;
  intention: Intention;
  askCount: number;
};

export type DailyLog = {
  id: number;
  userId: string;
  day: string;
  flow: Flow;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  notes: string;
  symptoms: string[];
  periodStarted: boolean;
  mucus: Mucus;
  sex: boolean;
  sexKind: SexKind;
};

export type TodaySnapshot = {
  profile: SaviaProfile;
  day: string;
  cycleDay: number | null;
  phase: Phase;
  pregnancyWeek: number | null;
  log: DailyLog | null;
  recentLogs: DailyLog[];
  periodStarts: string[];
  sexDays: string[];
  sexMarks: { day: string; kind: SexKind }[];
};

export const STAGES: Stage[] = ["cycle", "pregnancy", "postpartum", "peri", "meno"];
export const FLOWS: Flow[] = ["none", "spotting", "light", "medium", "heavy"];
export const INTENTIONS: Intention[] = ["track", "avoid", "ttc"];
export const MUCUS: Mucus[] = ["none", "sticky", "creamy", "eggwhite", "watery"];
export const SEX_KINDS: SexKind[] = ["protected", "unprotected", "withdrawal"];
export const SYMPTOMS = [
  "cramps",
  "headache",
  "bloating",
  "breast",
  "acne",
  "anxiety",
  "low_mood",
  "irritable",
  "insomnia",
  "hot_flash",
  "night_sweat",
  "libido_up",
  "libido_down",
  "fatigue",
  "brain_fog",
  "nausea",
  "spotting",
  "constipation",
  "craving",
  "discharge",
  "dryness",
  "pain_sex",
] as const;
export type SymptomId = (typeof SYMPTOMS)[number];
