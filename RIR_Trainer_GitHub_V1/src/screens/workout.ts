import type { AppStore } from '../store/app-store';
import type { ExercisePlanRow, WarmupRow } from '../types';
import { buildLadderPlan, exerciseHistory, formatWeights, numberValue } from '../logic/ladder';
import { formatLongDate, sessionType } from '../logic/date';
import { icon } from '../ui/icons';

function bool(value: unknown): boolean { return value === true || String(value).toLowerCase() === 'true'; }

function warmupName(row: WarmupRow): string { return String(row.Nombre || row.Tipo || 'Calentamiento'); }

function approximationHtml(first: ExercisePlanRow, weights: number[]): string {
  const working = weights[0] || numberValue(first.PesoActual);
  if (!working) return '';
  const percentages = [40, 60, 75, 90];
  const reps = ['8-10', '5', '3', '1-2'];
  return `<section class="card card-body"><div class="eyebrow">Aproximaciones · ${first.NombreEjercicio}</div><div class="approx-grid">${percentages.map((pct, i) => `<div class="approx"><strong>${Math.round(working * pct / 100 * 2) / 2} kg</strong><small>${pct}% · ${reps[i]} rep</small></div>`).join('')}</div></section>`;
}

export function renderWorkout(store: AppStore, sessionId: string, dateKey: string): string {
  const data = store.bootstrap!;
  const session = data.sesiones.find(row => row.ID_Sesion === sessionId);
  const exercises = data.ejercicios.filter(row => row.ID_Sesion === sessionId).sort((a, b) => numberValue(a.Orden) - numberValue(b.Orden));
  const planById = new Map(data.ejercicios.map(row => [row.ID_EjercicioPlan, row]));
  const active = store.activeWorkout?.sessionId === sessionId && store.activeWorkout.dateKey === dateKey ? store.activeWorkout : undefined;
  const type = sessionType(sessionId);
  const warmups = data.calentamientos
    .filter(row => String(row.SesionTipo || '').toUpperCase() === type && bool(row.Activo) && String(row.Entorno || 'Casa').toLowerCase() === store.settings.defaultEnvironment.toLowerCase())
    .filter(row => String(row.ModoCalculo || '').toUpperCase() !== 'PORCENTAJE_S1')
    .sort((a, b) => numberValue(a.Orden) - numberValue(b.Orden));
  const doneWarmups = new Set(active?.warmupsDone ?? []);
  const completedSets = exercises.reduce((sum, exercise) => sum + store.setsFor(exercise.ID_EjercicioPlan).filter(set => set.completed).length, 0);
  const totalSets = exercises.reduce((sum, exercise) => sum + numberValue(exercise.SeriesObjetivo), 0);
  const first = exercises[0];
  const firstLadder = first ? buildLadderPlan(first, exerciseHistory(first, data.registroSeries, planById)) : undefined;

  return `
    <header class="topbar"><button class="icon-button" data-action="back">${icon('back')}</button><div class="topbar-title">${type} · ${session?.NombreSesion || 'Sesión'}</div><button class="sync-pill" data-action="open-sync"><span class="sync-dot"></span>${store.syncLabel}</button></header>
    <main class="page">
      <section class="hero"><div class="eyebrow">${formatLongDate(dateKey)}</div><h1>${session?.NombreSesion || 'Entrenamiento'}</h1><p>${completedSets}/${totalSets} series registradas</p><div class="progress-track"><div class="progress-fill" style="width:${totalSets ? Math.min(100, completedSets / totalSets * 100) : 0}%"></div></div></section>

      <section class="card">
        <button class="warmup-toggle" data-action="toggle-warmup"><div class="session-icon">${icon('fire')}</div><div class="session-info"><strong>Calentamiento ${type}</strong><small>${warmups.length} activaciones · ${doneWarmups.size}/${warmups.length}</small></div>${icon('chevron-right', 20, 'warmup-chevron')}</button>
        <div class="warmup-list" id="warmup-list" hidden>
          ${warmups.map(row => `<div class="warmup-item"><button class="check-circle ${doneWarmups.has(row.ID_Calentamiento) ? 'done' : ''}" data-warmup="${row.ID_Calentamiento}">${doneWarmups.has(row.ID_Calentamiento) ? icon('check', 18) : ''}</button><div class="session-info"><strong>${warmupName(row)}</strong><small>${row.RepsDuracion || ''}${row.Detalle ? ` · ${row.Detalle}` : ''}</small></div></div>`).join('')}
        </div>
      </section>
      ${first && firstLadder ? approximationHtml(first, firstLadder.weights) : ''}

      <div class="section-head"><div><h2>Ejercicios</h2><p>Escalera prevista para hoy.</p></div></div>
      ${exercises.map((exercise, index) => {
        const sets = store.setsFor(exercise.ID_EjercicioPlan);
        const done = sets.filter(set => set.completed).length;
        const total = numberValue(exercise.SeriesObjetivo, 1);
        const ladder = buildLadderPlan(exercise, exerciseHistory(exercise, data.registroSeries, planById));
        return `<article class="exercise-card" data-exercise="${exercise.ID_EjercicioPlan}"><div class="exercise-top"><div class="exercise-number">${index + 1}</div><div class="session-info"><h3>${exercise.NombreEjercicio}</h3><div class="exercise-meta">${exercise.SeriesObjetivo} × ${exercise.RepsObjetivo} · RIR ${exercise.RIRObjetivo} · ${exercise.DescansoSegundos}s</div><div class="ladder">${formatWeights(ladder.weights)}</div></div><span class="status-badge ${done === total ? 'done' : ''}">${done}/${total}</span></div><div class="progress-track"><div class="progress-fill" style="width:${done / total * 100}%"></div></div></article>`;
      }).join('')}
      <div style="height:16px"></div>
      <button class="primary full" data-action="finish">Finalizar entrenamiento</button>
    </main>`;
}

export function bindWorkout(store: AppStore, sessionId: string, dateKey: string, onFinish: () => void, onWarmup: (id: string) => void): void {
  document.querySelector('[data-action="back"]')?.addEventListener('click', () => store.navigate({ name: 'day', dateKey }));
  const toggle = document.querySelector<HTMLElement>('[data-action="toggle-warmup"]');
  const list = document.getElementById('warmup-list');
  toggle?.addEventListener('click', () => { if (list) list.hidden = !list.hidden; });
  document.querySelectorAll<HTMLElement>('[data-warmup]').forEach(button => button.addEventListener('click', () => onWarmup(button.dataset.warmup!)));
  document.querySelectorAll<HTMLElement>('[data-exercise]').forEach(card => card.addEventListener('click', event => {
    if ((event.target as HTMLElement).closest('[data-warmup]')) return;
    store.navigate({ name: 'exercise', sessionId, exerciseId: card.dataset.exercise!, dateKey });
  }));
  document.querySelector('[data-action="finish"]')?.addEventListener('click', onFinish);
}
