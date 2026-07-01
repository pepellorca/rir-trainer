import type { AppStore } from '../store/app-store';
import type { ExercisePlanRow, LocalSet, SeriesRow } from '../types';
import { buildLadderPlan, exerciseHistory, formatWeight, nextSetAdvice, numberValue, parseRepRange } from '../logic/ladder';
import { icon } from '../ui/icons';

function latestGroups(history: SeriesRow[]): SeriesRow[][] {
  const groups = new Map<string, SeriesRow[]>();
  for (const row of history) {
    const key = String(row.ID_Entrenamiento || row.Fecha || 'legacy');
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.values()].sort((a, b) => {
    const latest = (rows: SeriesRow[]) => Math.max(...rows.map(row => new Date(String(row.Timestamp || row.Fecha || 0)).getTime() || 0));
    return latest(b) - latest(a);
  }).slice(0, 5);
}

function initialSets(plan: ExercisePlanRow, weights: number[], existing: LocalSet[]): LocalSet[] {
  const count = Math.max(1, Math.round(numberValue(plan.SeriesObjetivo, 1)));
  const range = parseRepRange(plan.RepsObjetivo);
  const rirValue = Number(String(plan.RIRObjetivo || '').match(/\d+/)?.[0] || 2);
  return Array.from({ length: count }, (_, index) => existing[index] ?? {
    seriesNumber: index + 1,
    weight: weights[index] ?? weights.at(-1) ?? numberValue(plan.PesoActual),
    reps: range.max,
    rir: rirValue,
    completed: false,
    revision: 0,
    synced: false,
  });
}

export function renderExercise(store: AppStore, sessionId: string, exerciseId: string, dateKey: string): string {
  const data = store.bootstrap!;
  const plan = data.ejercicios.find(row => row.ID_EjercicioPlan === exerciseId)!;
  const planById = new Map(data.ejercicios.map(row => [row.ID_EjercicioPlan, row]));
  const history = exerciseHistory(plan, data.registroSeries, planById);
  const ladder = buildLadderPlan(plan, history);
  const sets = initialSets(plan, ladder.weights, store.setsFor(exerciseId));
  const completed = sets.filter(set => set.completed);
  const nextIndex = Math.min(completed.length, sets.length - 1);
  const advice = nextSetAdvice(plan, ladder, completed, nextIndex);
  const groups = latestGroups(history);

  return `
    <header class="topbar"><button class="icon-button" data-action="back">${icon('back')}</button><div class="topbar-title">Ejercicio</div><button class="sync-pill" data-action="open-sync"><span class="sync-dot"></span>${store.syncLabel}</button></header>
    <section class="exercise-header">
      <div class="page" style="padding-bottom:0">
        <h1 class="exercise-title">${plan.NombreEjercicio}</h1>
        <div class="target-grid">
          <div class="target"><span>Series</span><strong>${plan.SeriesObjetivo}</strong></div>
          <div class="target"><span>Reps</span><strong style="color:var(--accent)">${plan.RepsObjetivo}</strong></div>
          <div class="target"><span>RIR</span><strong>${plan.RIRObjetivo}</strong></div>
          <div class="target"><span>Descanso</span><strong>${plan.DescansoSegundos}s</strong></div>
        </div>
      </div>
    </section>
    <main class="page">
      <section class="coach-card ${advice.tone === 'reduce' ? 'reduce' : ''}">
        <div class="eyebrow">Coach de cargas</div><h3>${advice.title}</h3><p>${advice.reason}</p>
      </section>
      ${plan.NotasEntrenador ? `<section class="card card-body"><div class="eyebrow">Nota del entrenador</div><p style="color:var(--muted);line-height:1.5;margin:8px 0 0">${plan.NotasEntrenador}</p></section>` : ''}

      <div class="section-head"><div><h2>Registro de series</h2><p>Se guarda automáticamente al completar.</p></div></div>
      <section class="set-table">
        <div class="set-head"><div>Serie</div><div>Peso kg</div><div>Reps</div><div>RIR</div><div></div></div>
        ${sets.map(set => `<div class="set-row ${set.completed ? 'done' : ''}" data-set-row="${set.seriesNumber}">
          <div class="set-label">S${set.seriesNumber}${set.completed ? '<small>GUARDADA</small>' : ''}</div>
          <input class="set-input" inputmode="decimal" type="number" step="0.5" min="0" value="${set.weight}" data-field="weight" data-series="${set.seriesNumber}" ${set.completed ? 'readonly' : ''}>
          <input class="set-input" inputmode="numeric" type="number" min="0" value="${set.reps}" data-field="reps" data-series="${set.seriesNumber}" ${set.completed ? 'readonly' : ''}>
          <input class="set-input" inputmode="numeric" type="number" min="0" max="10" value="${set.rir}" data-field="rir" data-series="${set.seriesNumber}" ${set.completed ? 'readonly' : ''}>
          <button class="check-circle ${set.completed ? 'done' : ''}" data-complete="${set.seriesNumber}">${set.completed ? icon('check',18) : ''}</button>
        </div>`).join('')}
      </section>

      <div class="section-head"><div><h2>Últimas ejecuciones</h2><p>${groups.length ? `Mejor carga: ${formatWeight(Math.max(...history.map(row => numberValue(row.Peso))))}` : 'Sin histórico'}</p></div></div>
      <section class="card">
        ${groups.length ? groups.map(rows => {
          const ordered = [...rows].sort((a,b) => numberValue(a.NumeroSerie)-numberValue(b.NumeroSerie));
          const date = String(ordered[0]?.Fecha || '').slice(0,10);
          const weights = ordered.map(row => numberValue(row.Peso));
          const reps = ordered.map(row => numberValue(row.RepsRealizadas));
          const rir = ordered.map(row => numberValue(row.RIRReal));
          return `<div class="history-row"><span>${date}</span><strong>${weights.join('/')} kg · ${reps.join('-')} rep</strong><span>RIR ${rir.join('-')}</span></div>`;
        }).join('') : '<div class="empty">El histórico aparecerá después de la primera sesión.</div>'}
      </section>
    </main>`;
}

export function bindExercise(
  store: AppStore,
  sessionId: string,
  exerciseId: string,
  dateKey: string,
  onComplete: (seriesNumber: number, set: LocalSet) => Promise<void>,
): void {
  document.querySelector('[data-action="back"]')?.addEventListener('click', () => store.navigate({ name: 'workout', sessionId, dateKey }));
  document.querySelectorAll<HTMLInputElement>('[data-field]').forEach(input => {
    input.addEventListener('change', async () => {
      const seriesNumber = Number(input.dataset.series);
      const field = input.dataset.field as 'weight' | 'reps' | 'rir';
      await store.updateWorkout(workout => {
        const plan = store.bootstrap!.ejercicios.find(row => row.ID_EjercicioPlan === exerciseId)!;
        const planById = new Map(store.bootstrap!.ejercicios.map(row => [row.ID_EjercicioPlan, row]));
        const ladder = buildLadderPlan(plan, exerciseHistory(plan, store.bootstrap!.registroSeries, planById));
        const current = initialSets(plan, ladder.weights, workout.setsByExercise[exerciseId] ?? []);
        const target = current[seriesNumber - 1]!;
        target[field] = Number(input.value);
        target.revision += 1;
        target.synced = false;
        workout.setsByExercise[exerciseId] = current;
      });
    });
  });
  document.querySelectorAll<HTMLElement>('[data-complete]').forEach(button => button.addEventListener('click', async () => {
    const seriesNumber = Number(button.dataset.complete);
    const plan = store.bootstrap!.ejercicios.find(row => row.ID_EjercicioPlan === exerciseId)!;
    const planById = new Map(store.bootstrap!.ejercicios.map(row => [row.ID_EjercicioPlan, row]));
    const ladder = buildLadderPlan(plan, exerciseHistory(plan, store.bootstrap!.registroSeries, planById));
    const current = initialSets(plan, ladder.weights, store.setsFor(exerciseId));
    const set = current[seriesNumber - 1]!;
    if (set.completed) return;
    set.completed = true;
    set.revision += 1;
    set.synced = false;
    await store.updateWorkout(workout => { workout.setsByExercise[exerciseId] = current; });
    await onComplete(seriesNumber, set);
  }));
}
