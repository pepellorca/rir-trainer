import type { AppStore } from '../store/app-store';
import type { CalendarActivityRow, SessionRow, WorkoutRow } from '../types';
import { formatDay, getCurrentMesocycle, getMesocycleWeeks, getWeekNumber, sessionType, toDateKey, weekDates } from '../logic/date';
import { icon } from '../ui/icons';

function isDone(workout: WorkoutRow | undefined): boolean {
  const state = String(workout?.Estado || '').toLowerCase();
  return state.includes('completa') || state.includes('parcial') || state.includes('final');
}

function activityForDate(activities: CalendarActivityRow[], dateKey: string): CalendarActivityRow[] {
  return activities.filter(activity => String(activity.Fecha || '').slice(0, 10) === dateKey && String(activity.Estado || '').toLowerCase() !== 'eliminado');
}

function weeklySessions(store: AppStore): SessionRow[] {
  const data = store.bootstrap!;
  const week = getWeekNumber(data, store.selectedWeekAnchor) ?? 1;
  const meso = getCurrentMesocycle(data);
  return data.sesiones
    .filter(session => String(session.ID_Sesion || '').startsWith(`${meso}-S${week}-`))
    .sort((a, b) => String(a.ID_Sesion).localeCompare(String(b.ID_Sesion)));
}

export function renderHome(store: AppStore): string {
  const data = store.bootstrap!;
  const dates = weekDates(store.selectedWeekAnchor);
  const selectedKey = toDateKey(store.selectedWeekAnchor);
  const sessions = weeklySessions(store);
  const currentWeek = getWeekNumber(data, store.selectedWeekAnchor) ?? 1;
  const totalWeeks = getMesocycleWeeks(data);
  const meso = getCurrentMesocycle(data);
  const completed = sessions.filter(session => data.registroEntrenamientos.some(workout => workout.ID_Sesion === session.ID_Sesion && isDone(workout))).length;
  const cardio = dates.flatMap(date => activityForDate(data.calendarioActividades, toDateKey(date))).filter(a => String(a.Categoria).toLowerCase() === 'cardio');
  const steps = cardio.reduce((sum, item) => sum + Number(item.Pasos || 0), 0);

  return `
    <header class="topbar">
      <div class="brand">RIR Trainer</div>
      <button class="sync-pill" data-action="open-sync"><span class="sync-dot"></span><span>${store.syncLabel}</span></button>
    </header>
    <main class="page">
      <section class="hero">
        <div class="eyebrow">${meso} · Semana ${currentWeek} de ${totalWeeks}</div>
        <h1>Tu semana de entrenamiento</h1>
        <p>Completa D1, D2 y D3. En cada día puedes añadir cardio, paseo o pasos.</p>
        <div class="metrics">
          <div class="metric"><strong>${completed}/3</strong><span>Fuerza</span></div>
          <div class="metric"><strong>${cardio.length}</strong><span>Cardio</span></div>
          <div class="metric"><strong>${steps.toLocaleString('es-ES')}</strong><span>Pasos</span></div>
        </div>
      </section>

      <section class="card card-body">
        <div class="week-strip">
          ${dates.map(date => {
            const key = toDateKey(date);
            const has = activityForDate(data.calendarioActividades, key).length > 0;
            return `<button class="day-chip ${key === selectedKey ? 'selected' : ''} ${has ? 'has-activity' : ''}" data-date="${key}"><span>${formatDay(date).split(' ')[0]}</span><strong>${date.getDate()}</strong></button>`;
          }).join('')}
        </div>
      </section>

      <div class="section-head"><div><h2>Sesiones de la semana</h2><p>El peso alto se consolida serie a serie.</p></div></div>
      <section class="card">
        ${sessions.map(session => {
          const workout = data.registroEntrenamientos.find(row => row.ID_Sesion === session.ID_Sesion && isDone(row));
          const done = Boolean(workout);
          return `<div class="session-row ${done ? 'done' : ''}" data-session="${session.ID_Sesion}">
            <div class="session-icon">${icon(done ? 'check' : 'dumbbell')}</div>
            <div class="session-info"><strong>${sessionType(session.ID_Sesion)} · ${session.NombreSesion || 'Sesión de fuerza'}</strong><small>${done ? 'Finalizada esta semana' : 'Pendiente de esta semana'}</small></div>
            <span class="status-badge ${done ? 'done' : ''}">${done ? 'Hecha' : 'Disponible'}</span>
          </div>`;
        }).join('')}
      </section>
    </main>`;
}

export function bindHome(store: AppStore): void {
  document.querySelectorAll<HTMLElement>('[data-date]').forEach(button => {
    button.addEventListener('click', () => store.navigate({ name: 'day', dateKey: button.dataset.date! }));
  });
  document.querySelectorAll<HTMLElement>('[data-session]').forEach(row => {
    row.addEventListener('click', async () => {
      const sessionId = row.dataset.session!;
      const workout = store.bootstrap!.registroEntrenamientos.find(item => item.ID_Sesion === sessionId && isDone(item));
      const dateKey = workout?.Fecha ? String(workout.Fecha).slice(0, 10) : toDateKey(new Date());
      await store.startWorkout(sessionId, dateKey);
      store.navigate({ name: 'workout', sessionId, dateKey });
    });
  });
}
