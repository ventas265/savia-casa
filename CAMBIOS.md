# Savia — cambios de posicionamiento (ciclo primero)

Fecha: 2026-09-14

## Objetivo
Reposicionar Savia frente a Flo: ciclo / bienestar / privacidad primero; embarazo, fertilidad, posparto, peri y meno como secundarios u opt-in.

## Cambios

### 1. Onboarding (`src/routes/app/onboarding.tsx` + i18n)
- Pantalla «¿Dónde está tu cuerpo ahora?» muestra solo **Tengo el ciclo** como opción principal.
- Embarazo / posparto / peri / meno van detrás del enlace **«Mi situación es otra»** / **«My situation is different»**.
- `intention` sigue en `"track"` por defecto (fertilidad apagada).

### 2. Landing / welcome (`src/lib/i18n.tsx` → welcomeTitle / welcomeShort / hero*)
- **ES:** «Tu ciclo, en tus palabras.» + «Anota cómo te sientes, entiende tu mes y guarda todo en privado. Sin presión. Sin tarjeta para empezar.»
- **EN:** «Your cycle, in your words.» + «Log how you feel, understand your month, and keep it private. No pressure. No card to start.»
- Sin embarazo/fertilidad en el hero.

### 3. Guía tabs (`src/components/library-body.tsx`)
Orden: hormonas → tés → comida → peri → meno → **embarazo → posparto** (últimos).

### 4. Fertilidad opt-in (`src/routes/app/mas.tsx` + predictions / calendar / today)
- Off por defecto (`intention === "track"`).
- Toggle en Más/Ajustes: «Mostrar ventana fértil» / «Show fertile window».
- Copy: «Un dato de tu ciclo. No es una meta ni un consejo para concebir.»
- Al encender, `intention` pasa a `"avoid"` (dato de ciclo, no TTC).
- Calendario, predicciones y Hoy ocultan ventana fértil / marcas peak-fertile si está off.

### 5. Cuadernos (`booksHint`)
- Antes: «Solo tú. Cuántas se inscribieron en Savia.»
- Ahora: «Tu espacio. Nadie más entra aquí.» (+ EN equivalente).

### 6. Registro (`src/components/log-form.tsx`)
- mood / energy / sleepHours arrancan en `null` (sin selección fantasma 3 / 3 / 7).

### 7. PII de pago
- Eliminados teléfono, cédula, PayPal y Binance hard-codeados de `emptyPay` (`savia-server.ts`) y del form admin en `cuaderno.tsx`.
- `getPay` sigue siendo un server fn GET público: si hay valores en DB, `/pagar` y Más pueden mostrarlos. Riesgo residual anotado abajo.

## Archivos tocados
- `src/lib/i18n.tsx`
- `src/routes/app/onboarding.tsx`
- `src/components/library-body.tsx`
- `src/components/log-form.tsx`
- `src/components/predictions.tsx`
- `src/components/cycle-calendar.tsx`
- `src/components/today-hero.tsx`
- `src/routes/app/calendario.tsx`
- `src/routes/app/hoy.tsx`
- `src/routes/app/mas.tsx`
- `src/lib/savia-server.ts`
- `src/routes/app/cuaderno.tsx`

## Verificación
- `npm run typecheck` → OK (tsc --noEmit).

## Riesgos restantes
- `getPay` sin auth: con settings en DB, datos de cobro siguen visibles en rutas de pago/Más. Mitigación mínima hecha (sin defaults en cliente); endurecer con auth si se quiere cerrar del todo.
- Contenido de guía / términos / cartas sigue mencionando embarazo (educativo, no hero). Disclaimers médicos intactos.
- Toggle de fertilidad usa `intention: avoid|track`; modo TTC (`ttc`) no tiene UI dedicada en Más (sigue existiendo en tipos/informe).

## Ops

- Migrate `XAI_API_KEY` from build-time Vite inject to Vercel Environment Variables (Production + Preview). Current `vite` define breaks on deploys without the env at build time; chat may fail until the key is set as a runtime/build env or Grok Build redeploys with it.
