export const LATAM = [
  { code: "MX", name: "México", emergency: "911" },
  { code: "CO", name: "Colombia", emergency: "123" },
  { code: "AR", name: "Argentina", emergency: "107" },
  { code: "VE", name: "Venezuela", emergency: "911" },
  { code: "CL", name: "Chile", emergency: "131" },
  { code: "PE", name: "Perú", emergency: "106" },
  { code: "EC", name: "Ecuador", emergency: "911" },
  { code: "BO", name: "Bolivia", emergency: "118" },
  { code: "PY", name: "Paraguay", emergency: "911" },
  { code: "UY", name: "Uruguay", emergency: "911" },
  { code: "CR", name: "Costa Rica", emergency: "911" },
  { code: "PA", name: "Panamá", emergency: "911" },
  { code: "DO", name: "Rep. Dominicana", emergency: "911" },
  { code: "GT", name: "Guatemala", emergency: "128" },
  { code: "HN", name: "Honduras", emergency: "911" },
  { code: "SV", name: "El Salvador", emergency: "911" },
  { code: "NI", name: "Nicaragua", emergency: "118" },
] as const;

export type CountryCode = (typeof LATAM)[number]["code"];

export function latamOf(code?: string | null) {
  return LATAM.find((c) => c.code === code) ?? LATAM[0];
}

export function emergencyLine(code?: string | null) {
  const row = latamOf(code);
  return `${row.name}: ${row.emergency}`;
}
