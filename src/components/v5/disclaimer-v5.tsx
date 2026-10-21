import { Info } from "@phosphor-icons/react";

export const DISCLAIMER =
  "Savia no es un método anticonceptivo ni un dispositivo médico certificado. Las predicciones son estimaciones y no deben usarse para evitar un embarazo. Usa un método anticonceptivo y consulta a un profesional de salud.";

export function DisclaimerV5() {
  return (
    <p className="mt-6 flex gap-2 text-[12px] leading-relaxed v5-muted" role="note">
      <Info size={16} weight="light" className="mt-0.5 shrink-0" aria-hidden />
      {DISCLAIMER}
    </p>
  );
}
