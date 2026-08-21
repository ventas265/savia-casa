const NICK: Record<string, string> = {
  isabel: "Isa",
  isabella: "Isa",
  andrea: "Andre",
  paola: "Pao",
  paula: "Pao",
  claudia: "Clau",
  maria: "Mari",
  carolina: "Caro",
  valentina: "Vale",
  gabriela: "Gabi",
  patricia: "Patri",
  alejandra: "Ale",
  fernanda: "Fer",
  daniela: "Dani",
  veronica: "Vero",
  victoria: "Vicky",
  catalina: "Cata",
  camila: "Cami",
  lorena: "Lore",
  yamileth: "Yami",
  yamilet: "Yami",
  josefina: "Jose",
  antonia: "Toña",
  soledad: "Sole",
  esperanza: "Espe",
  magdalena: "Magda",
  teresa: "Tere",
  cristina: "Cris",
  katherine: "Kathe",
  catherine: "Cathe",
  jennifer: "Jenni",
  stephanie: "Steph",
  nicole: "Nico",
  michelle: "Mish",
  elizabeth: "Eli",
};

function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function callName(raw?: string | null) {
  const first = (raw || "").trim().split(/\s+/)[0] || "";
  if (!first) return "";
  return NICK[fold(first)] || first;
}
