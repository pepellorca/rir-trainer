import type { AppStore } from '../store/app-store';
import { formatLongDate, getCurrentMesocycle, getWeekNumber, sessionType } from '../logic/date';
import { icon } from '../ui/icons';

function workoutDone(state: unknown): boolean {
  const value = String(state || '').toLowerCase();
  return value.includes('completa') || value.includes('parcial') || value.includes('final');
}

export function renderDay(store: AppStore, dateKey: string): string {
  const data = store.bootstrap!;
  const date = new Date(`${dateKey}T12:00:00`);
  const week = getWeekNumber(data, date);
  const meso = getCurrentMesocycle(data);
  const sessions = week
    ? data.sesiones.filter(s => String(s.ID_Sesion).startsWith(`${meso}-S${week}-`)).sort((a, b) => String(a.ID_Sesion).localeCompare(String(b.ID_Sesion)))
    : [];
  const activities = data.calendarioActividades.filter(a => String(a.Fecha || '').slice(0, 10) === dateKey && String(a.Estado || '').toLowerCase() !== 'eliminado');
  const strength = activities.find(a => String(a.Categoria || '').toLowerCase() === 'fuerza');
  const strengthWorkout = strength?.ID_Entrenamiento
    ? data.registroEntrenamientos.find(w => w.ID_Entrenamiento === strength.ID_Entrenamiento)
    : data.registroEntrenamientos.find(w => String(w.Fecha || '').slice(0, 10) === dateKey && sessions.some(s => s.ID_Sesion === w.ID_Sesion));
  const completedSessionIds = new Set(data.registroEntrenamientos.filter(w => workoutDone(w.Estado)).map(w => w.ID_Sesion));
  const pending = sessions.filter(s => !completedSessionIds.has(s.ID_Sesion));
  const recommended = pending[0];

  return `
    <header class="topbar"><button class="icon-button" data-action="back">${icon('back')}</button><div class="topbar-title">${formatLongDate(dateKey)}</div><span></span></header>
    <main class="page">
      ${strengthWorkout ? `
        <section class="hero">
          <div class="eyebrow">Fuerza realizada</div>
          <h1>${sessionType(strengthWorkout.ID_Sesion)} · ${sessions.find(s => s.ID_Sesion === strengthWorkout.ID_Sesion)?.NombreSesion || 'Entrenamiento'}</h1>
          <p>${workoutDone(strengthWorkout.Estado) ? 'Sesión finalizada. Puedes consultarla o editarla de forma explícita.' : 'Entrenamiento en curso. Continúa donde lo dejaste.'}</p>
          <button class="primary full" data-open-workout="${strengthWorkout.ID_Sesion}">${workoutDone(strengthWorkout.Estado) ? 'Ver entrenamiento' : 'Continuar entrenamiento'}</button>
        </section>` : recommended ? `
        <section class="hero">
          <div class="eyebrow">Sesión recomendada</div>
          <h1>${sessionType(recommended.ID_Sesion)} · ${recommended.NombreSesion || 'Sesión de fuerza'}</h1>
          <p>La app solo ofrece sesiones pendientes de esta semana y permite una única fuerza por día.</p>
          <button class="primary full" data-start-session="${recommended.ID_Sesion}">Empezar ${sessionType(recommended.ID_Sesion)}</button>
        </section>
        <section class="card">
          ${pending.slice(1).map(session => `<div class="session-row" data-start-session="${session.ID_Sesion}"><div class="session-icon">${icon('dumbbell')}</div><div class="session-info"><strong>${sessionType(session.ID_Sesion)} · ${session.NombreSesion}</strong><small>Otra sesión pendiente</small></div>${icon('chevron-right')}</div>`).join('')}
        </section>` : `<section class="hero"><div class="eyebrow">Semana completa</div><h1>Las tres sesiones están hechas</h1><p>Puedes añadir cardio o consultar el histórico.</p></section>`}

      <div class="section-head"><div><h2>Actividad adicional</h2><p>Cardio, paseo, natación, bici o pasos.</p></div></div>
      <section class="card">
        ${activities.filter(a => String(a.Categoria).toLowerCase() === 'cardio').map(a => `<div class="session-row"><div class="session-icon">${icon('heart')}</div><div class="session-info"><strong>${a.Tipo || 'Cardio'}</strong><small>${a.DuracionMin ? `${a.DuracionMin} min` : ''}${a.Pasos ? ` · ${Number(a.Pasos).toLocaleString('es-ES')} pasos` : ''}</small></div><span class="status-badge done">Hecho</span></div>`).join('')}
        <div class="session-row" data-action="add-cardio"><div class="session-icon">${icon('plus')}</div><div class="session-info"><strong>Añadir cardio o pasos</strong><small>Registra una actividad complementaria.</small></div>${icon('chevron-right')}</div>
      </section>
    </main>`;
}

export function bindDay(store: AppStore, dateKey: string, openCardio: () => void): void {
  document.querySelector('[data-action="back"]')?.addEventListener('click', () => store.navigate({ name: 'home' }));
  document.querySelector('[data-action="add-cardio"]')?.addEventListener('click', openCardio);
  document.querySelectorAll<HTMLElement>('[data-start-session]').forEach(button => {
    button.addEventListener('click', async () => {
      const sessionId = button.dataset.startSession!;
      await store.startWorkout(sessionId, dateKey);
      store.navigate({ name: 'workout', sessionId, dateKey });
    });
  });
  document.querySelectorAll<HTMLElement>('[data-open-workout]').forEach(button => {
    button.addEventListener('click', async () => {
      const sessionId = button.dataset.openWorkout!;
      await store.startWorkout(sessionId, dateKey);
      store.navigate({ name: 'workout', sessionId, dateKey });
    });
  });
}
