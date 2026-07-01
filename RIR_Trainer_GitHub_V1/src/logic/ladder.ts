import type { ExercisePlanRow, LocalSet, SeriesRow } from '../types';

export interface RepRange { min: number; max: number }
export interface LadderPlan {
  weights: number[];
  headline: string;
  explanation: string;
  increment: number;
  reduction: number;
}

export interface NextSetAdvice {
  weight: number;
  title: string;
  reason: string;
  tone: 'progress' | 'maintain' | 'reduce';
}

export function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseRepRange(value: unknown): RepRange {
  const values = String(value ?? '').match(/\d+(?:[.,]\d+)?/g)?.map(v => numberValue(v)) ?? [];
  if (!values.length) return { min: 1, max: 1 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function normalizeExerciseName(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(con pausa|lastrad[ao]|convencional|simetric[ao])\b/g, '')
    .replace(/\b(agarre (ancho|cerrado|neutro|prono)|de pie|unilateral)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function roundToStep(value: number, step = 0.5): number {
  if (step <= 0) return Math.round(value * 2) / 2;
  return Math.round(value / step) * step;
}

function inferIncrement(plan: ExercisePlanRow): number {
  const explicit = numberValue(plan.IncrementoCarga);
  if (explicit > 0) return explicit;
  const group = String(plan.GrupoMuscular || '').toLowerCase();
  const name = String(plan.NombreEjercicio || '').toLowerCase();
  if (name.includes('dominada') || name.includes('curl') || name.includes('elevacion')) return 1;
  if (/cuadr|isquio|glute|pierna/.test(group)) return 5;
  return 2.5;
}

function inferReduction(plan: ExercisePlanRow, increment: number): number {
  const explicit = numberValue(plan.ReduccionCarga);
  return explicit > 0 ? explicit : increment;
}

function latestExecution(history: SeriesRow[]): SeriesRow[] {
  const groups = new Map<string, SeriesRow[]>();
  for (const row of history) {
    const key = String(row.ID_Entrenamiento || row.Fecha || 'legacy');
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.values()].sort((a, b) => {
    const time = (rows: SeriesRow[]) => Math.max(...rows.map(row => new Date(String(row.Timestamp || row.Fecha || 0)).getTime() || 0));
    return time(b) - time(a);
  })[0] ?? [];
}

export function exerciseHistory(plan: ExercisePlanRow, allSeries: SeriesRow[], planById: Map<string, ExercisePlanRow>): SeriesRow[] {
  const target = normalizeExerciseName(plan.NombreEjercicio);
  return allSeries.filter(row => {
    const sourcePlan = planById.get(String(row.ID_EjercicioPlan));
    const actualName = row.NombreEjercicioReal || sourcePlan?.NombreEjercicio;
    return normalizeExerciseName(actualName) === target && String(row.Completada).toLowerCase() !== 'false';
  });
}

export function buildLadderPlan(plan: ExercisePlanRow, history: SeriesRow[]): LadderPlan {
  const seriesCount = Math.max(1, Math.round(numberValue(plan.SeriesObjetivo, 1)));
  const { min } = parseRepRange(plan.RepsObjetivo);
  const increment = inferIncrement(plan);
  const reduction = inferReduction(plan, increment);
  const latest = latestExecution(history).sort((a, b) => numberValue(a.NumeroSerie) - numberValue(b.NumeroSerie));

  if (!latest.length) {
    const base = numberValue(plan.PesoActual);
    return {
      weights: Array(seriesCount).fill(base),
      headline: base > 0 ? `Inicio · ${formatWeights(Array(seriesCount).fill(base))}` : 'Define la primera carga',
      explanation: 'No hay una ejecución anterior comparable. Se utiliza la carga de referencia del plan.',
      increment,
      reduction,
    };
  }

  const previous = Array.from({ length: seriesCount }, (_, index) => {
    const row = latest.find(item => numberValue(item.NumeroSerie) === index + 1) ?? latest[index];
    return {
      weight: numberValue(row?.Peso),
      reps: numberValue(row?.RepsRealizadas),
      ok: numberValue(row?.RepsRealizadas) >= min,
    };
  });
  const highest = previous[0]?.weight || Math.max(...previous.map(item => item.weight));
  const allSame = previous.every(item => Math.abs(item.weight - highest) < 0.001);
  const allInRange = previous.every(item => item.ok);

  if (allSame && allInRange) {
    const next = Array(seriesCount).fill(highest);
    next[0] = roundToStep(highest + increment, loadStep(plan));
    return {
      weights: next,
      headline: `Sube solo S1 · ${formatWeights(next)}`,
      explanation: `Has consolidado ${formatWeight(highest)} en todas las series. La carga nueva entra primero en S1.`,
      increment,
      reduction,
    };
  }

  const next = previous.map(item => item.weight);
  let leadingConsolidated = 0;
  for (const item of previous) {
    if (Math.abs(item.weight - highest) < 0.001 && item.ok) leadingConsolidated += 1;
    else break;
  }

  if (leadingConsolidated > 0 && leadingConsolidated < seriesCount) {
    next[leadingConsolidated] = highest;
    for (let index = leadingConsolidated + 1; index < seriesCount; index += 1) {
      next[index] = previous[index]?.weight || Math.max(0, highest - reduction * (index - leadingConsolidated));
    }
    return {
      weights: next.map(weight => roundToStep(weight, loadStep(plan))),
      headline: `Extiende la carga · ${formatWeights(next)}`,
      explanation: `Has consolidado ${formatWeight(highest)} en ${leadingConsolidated}/${seriesCount} series. Intenta llevarla a S${leadingConsolidated + 1}.`,
      increment,
      reduction,
    };
  }

  return {
    weights: next.map(weight => roundToStep(weight, loadStep(plan))),
    headline: `Repite la escalera · ${formatWeights(next)}`,
    explanation: 'Mantén la carga alta de S1 y consolida progresivamente las siguientes series.',
    increment,
    reduction,
  };
}

export function nextSetAdvice(
  plan: ExercisePlanRow,
  ladder: LadderPlan,
  completed: LocalSet[],
  nextIndex: number,
): NextSetAdvice {
  const { min } = parseRepRange(plan.RepsObjetivo);
  const planned = ladder.weights[nextIndex] ?? ladder.weights.at(-1) ?? 0;
  const previous = completed[nextIndex - 1];
  if (!previous) {
    return { weight: planned, title: `S${nextIndex + 1} · ${formatWeight(planned)}`, reason: 'Carga prevista por la escalera.', tone: 'maintain' };
  }
  if (previous.reps < min) {
    const reduced = roundToStep(Math.min(planned, Math.max(0, previous.weight - ladder.reduction)), loadStep(plan));
    return {
      weight: reduced,
      title: `Ajusta S${nextIndex + 1} a ${formatWeight(reduced)}`,
      reason: `En S${nextIndex} no alcanzaste el mínimo de ${min} repeticiones. Bajamos un escalón para volver al rango.`,
      tone: 'reduce',
    };
  }
  const same = Math.max(planned, previous.weight);
  return {
    weight: same,
    title: `Consolida ${formatWeight(same)}`,
    reason: `S${nextIndex} quedó dentro del rango. Intenta mantener la carga alta en S${nextIndex + 1}.`,
    tone: 'progress',
  };
}

export function loadStep(plan: ExercisePlanRow): number {
  const unit = String(plan.UnidadCarga || '').toLowerCase();
  if (unit.includes('mancuerna') || unit.includes('lastre')) return 0.5;
  return 0.5;
}

export function formatWeight(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1).replace('.', ',')} kg`;
}

export function formatWeights(weights: number[]): string {
  return weights.map(formatWeight).join(' / ');
}
