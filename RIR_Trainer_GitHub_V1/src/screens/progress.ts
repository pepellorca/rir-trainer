import type { AppStore } from '../store/app-store';
import { getCurrentMesocycle, getMesocycleWeeks } from '../logic/date';
import { normalizeExerciseName, numberValue } from '../logic/ladder';

export function renderProgress(store: AppStore): string {
  const data = store.bootstrap!;
  const meso = getCurrentMesocycle(data);
  const workouts = data.registroEntrenamientos.filter(row => String(row.ID_Sesion || '').startsWith(meso));
  const completed = workouts.filter(row => /completa|parcial|final/i.test(String(row.Estado || '')));
  const volume = completed.reduce((sum, row) => sum + numberValue(row.VolumenKg), 0);
  const sets = data.registroSeries.filter(row => {
    const plan = data.ejercicios.find(exercise => exercise.ID_EjercicioPlan === row.ID_EjercicioPlan);
    return plan && String(plan.ID_EjercicioPlan).startsWith(meso) && String(row.Completada).toLowerCase() !== 'false';
  });
  const byExercise = new Map<string, { name: string; max: number; count: number }>();
  for (const row of sets) {
    const plan = data.ejercicios.find(item => item.ID_EjercicioPlan === row.ID_EjercicioPlan);
    const name = String(row.NombreEjercicioReal || plan?.NombreEjercicio || 'Ejercicio');
    const key = normalizeExerciseName(name);
    const current = byExercise.get(key) ?? { name, max: 0, count: 0 };
    current.max = Math.max(current.max, numberValue(row.Peso));
    current.count += 1;
    byExercise.set(key, current);
  }
  const top = [...byExercise.values()].sort((a,b) => b.max-a.max).slice(0,8);
  return `
    <header class="topbar"><div class="brand">Progreso</div><button class="sync-pill" data-action="open-sync"><span class="sync-dot"></span>${store.syncLabel}</button></header>
    <main class="page">
      <section class="hero"><div class="eyebrow">${meso} · ${getMesocycleWeeks(data)} semanas</div><h1>${completed.length} sesiones completadas</h1><p>${Math.round(volume).toLocaleString('es-ES')} kg de volumen externo acumulado.</p><div class="metrics"><div class="metric"><strong>${completed.length}</strong><span>Sesiones</span></div><div class="metric"><strong>${sets.length}</strong><span>Series</span></div><div class="metric"><strong>${Math.round(volume/Math.max(1,completed.length)).toLocaleString('es-ES')}</strong><span>Kg/sesión</span></div></div></section>
      <div class="section-head"><div><h2>Mejores cargas</h2><p>Récord de peso por ejercicio.</p></div></div>
      <section class="card">
        ${top.length ? top.map(item => `<div class="session-row"><div class="session-info"><strong>${item.name}</strong><small>${item.count} series registradas</small></div><span class="status-badge done">${item.max} kg</span></div>`).join('') : '<div class="empty">Aún no hay datos suficientes.</div>'}
      </section>
    </main>`;
}

export function bindProgress(): void {}
