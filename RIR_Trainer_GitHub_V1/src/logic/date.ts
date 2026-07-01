import type { BootstrapData, ConfigRow, SessionRow } from '../types';

export function toDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? parseFlexibleDate(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseFlexibleDate(value: string | number | Date | null | undefined): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const raw = String(value ?? '').trim();
  if (!raw) return new Date();
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slash) {
    const year = Number(slash[3]) < 100 ? 2000 + Number(slash[3]) : Number(slash[3]);
    return new Date(year, Number(slash[2]) - 1, Number(slash[1]));
  }
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

export function weekDates(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return d;
  });
}

export function getCurrentConfig(data: BootstrapData): ConfigRow {
  return data.config[0] ?? {};
}

export function getCurrentMesocycle(data: BootstrapData): string {
  return String(getCurrentConfig(data).MesocicloActual || inferMesocycle(data.sesiones) || 'M1');
}

function inferMesocycle(sessions: SessionRow[]): string | null {
  for (const session of sessions) {
    const match = String(session.ID_Sesion || '').match(/^(M\d+)/i);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return null;
}

export function getMesocycleStart(data: BootstrapData): Date {
  return parseFlexibleDate(getCurrentConfig(data).FechaInicio);
}

export function getMesocycleWeeks(data: BootstrapData): number {
  const config = getCurrentConfig(data);
  const configured = Number(config.NumeroSemanas || 0);
  if (configured > 0) return configured;
  const meso = getCurrentMesocycle(data);
  const weeks = data.sesiones
    .filter(session => String(session.ID_Sesion || '').startsWith(`${meso}-`))
    .map(session => Number(String(session.ID_Sesion).match(/-S(\d+)-/)?.[1] || session.Semana || 0));
  const exerciseWeeks = data.ejercicios
    .filter(exercise => String(exercise.ID_EjercicioPlan || '').startsWith(`${meso}-`))
    .map(exercise => Number(String(exercise.ID_EjercicioPlan).match(/-S(\d+)-/)?.[1] || 0));
  return Math.max(1, ...weeks, ...exerciseWeeks);
}

export function getWeekNumber(data: BootstrapData, date: Date): number | null {
  const start = getMesocycleStart(data);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor((target.getTime() - start.getTime()) / 86400000);
  if (days < 0) return null;
  const week = Math.floor(days / 7) + 1;
  return week <= getMesocycleWeeks(data) ? week : null;
}

export function sessionType(sessionId: string): 'D1' | 'D2' | 'D3' | '' {
  const match = sessionId.match(/-(D[123])(?:-|$)/i);
  return (match?.[1]?.toUpperCase() as 'D1' | 'D2' | 'D3' | undefined) ?? '';
}

export function formatDay(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric' }).format(date);
}

export function formatLongDate(dateKey: string): string {
  const date = parseFlexibleDate(dateKey);
  const value = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}
