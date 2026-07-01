import './styles.css';
import { AppStore } from './store/app-store';
import { ApiClient } from './services/api';
import { SyncQueue, type SyncState } from './services/sync';
import { RestTimer } from './services/rest-timer';
import { renderHome, bindHome } from './screens/home';
import { renderDay, bindDay } from './screens/day';
import { renderWorkout, bindWorkout } from './screens/workout';
import { renderExercise, bindExercise } from './screens/exercise';
import { renderProgress, bindProgress } from './screens/progress';
import { renderSettings, bindSettings } from './screens/settings';
import type { AppSettings, LocalSet } from './types';
import { icon } from './ui/icons';
import { numberValue } from './logic/ladder';
import { toDateKey } from './logic/date';

export class RirApp {
  private readonly store = new AppStore();
  private readonly api = new ApiClient(() => this.store.settings);
  private readonly sync = new SyncQueue(this.api);
  private readonly timer = new RestTimer();
  private modal = '';
  private toastTimer?: number;

  async init(): Promise<void> {
    await this.store.init();
    await this.sync.init();
    await this.timer.init();
    this.store.subscribe(() => this.render());
    this.sync.subscribe(state => this.updateSync(state));
    this.timer.subscribe(state => { this.store.restTimer = state; this.renderTimer(); });
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.store.loading = true;
    this.store.error = '';
    this.render();
    try {
      const data = await this.api.bootstrap();
      await this.store.setBootstrap(data);
    } catch (error) {
      if (!this.store.bootstrap) this.store.error = error instanceof Error ? error.message : String(error);
      else this.toast('Sin conexión: se usan los últimos datos guardados', 'error');
    } finally {
      this.store.loading = false;
      this.render();
    }
  }

  private render(): void {
    const root = document.getElementById('app');
    if (!root) return;
    if (this.store.loading && !this.store.bootstrap) {
      root.innerHTML = `<div class="app-shell"><header class="topbar"><div class="brand">RIR Trainer</div></header><div class="loading"><div><div class="spinner"></div>Cargando tu plan…</div></div></div>`;
      return;
    }
    if (this.store.error && !this.store.bootstrap) {
      root.innerHTML = `<div class="app-shell"><header class="topbar"><div class="brand">RIR Trainer</div></header><main class="page"><section class="hero"><div class="eyebrow">No se pudo iniciar</div><h1>Revisa la conexión</h1><p>${this.escape(this.store.error)}</p><div style="height:16px"></div><button class="primary full" data-action="settings-from-error">Abrir ajustes</button></section></main></div>`;
      document.querySelector('[data-action="settings-from-error"]')?.addEventListener('click', () => this.store.navigate({ name: 'settings' }));
      return;
    }

    const route = this.store.route;
    let content = '';
    if (route.name === 'home') content = renderHome(this.store);
    if (route.name === 'day') content = renderDay(this.store, route.dateKey);
    if (route.name === 'workout') content = renderWorkout(this.store, route.sessionId, route.dateKey);
    if (route.name === 'exercise') content = renderExercise(this.store, route.sessionId, route.exerciseId, route.dateKey);
    if (route.name === 'progress') content = renderProgress(this.store);
    if (route.name === 'settings') content = renderSettings(this.store);

    const detail = ['day', 'workout', 'exercise'].includes(route.name);
    root.innerHTML = `<div class="app-shell">${content}${detail ? '' : this.renderNav()}<div id="timer-slot"></div><div id="modal-slot"></div><div class="toast" id="toast"></div></div>`;
    this.bindRoute();
    this.bindGlobal();
    this.renderTimer();
    this.renderModal();
  }

  private bindRoute(): void {
    const route = this.store.route;
    if (route.name === 'home') bindHome(this.store);
    if (route.name === 'day') bindDay(this.store, route.dateKey, () => { this.modal = 'cardio'; this.renderModal(); });
    if (route.name === 'workout') bindWorkout(
      this.store,
      route.sessionId,
      route.dateKey,
      () => { this.modal = 'finish'; this.renderModal(); },
      id => void this.toggleWarmup(id),
    );
    if (route.name === 'exercise') bindExercise(
      this.store,
      route.sessionId,
      route.exerciseId,
      route.dateKey,
      (seriesNumber, set) => this.completeSeries(route.sessionId, route.exerciseId, route.dateKey, seriesNumber, set),
    );
    if (route.name === 'progress') bindProgress();
    if (route.name === 'settings') bindSettings(
      this.store,
      () => this.testApi(),
      () => this.requestNotifications(),
      (message, type) => this.toast(message, type),
    );
  }

  private bindGlobal(): void {
    document.querySelectorAll('[data-action="open-sync"]').forEach(button => button.addEventListener('click', () => { this.modal = 'sync'; this.renderModal(); }));
    document.querySelectorAll<HTMLElement>('[data-nav]').forEach(button => button.addEventListener('click', () => {
      const nav = button.dataset.nav;
      this.store.navigate(nav === 'progress' ? { name: 'progress' } : nav === 'settings' ? { name: 'settings' } : { name: 'home' });
    }));
  }

  private renderNav(): string {
    const route = this.store.route.name;
    return `<nav class="bottom-nav"><div class="bottom-nav-inner">
      <button class="nav-button ${route === 'home' ? 'active' : ''}" data-nav="home">${icon('calendar')}<span>Semana</span></button>
      <button class="nav-button ${route === 'progress' ? 'active' : ''}" data-nav="progress">${icon('chart')}<span>Progreso</span></button>
      <button class="nav-button ${route === 'settings' ? 'active' : ''}" data-nav="settings">${icon('settings')}<span>Ajustes</span></button>
    </div></nav>`;
  }

  private async ensureWorkoutStarted(sessionId: string, dateKey: string): Promise<void> {
    const workout = await this.store.startWorkout(sessionId, dateKey);
    await this.sync.enqueue({
      type: 'workoutStart',
      ID_Entrenamiento: workout.workoutId,
      ID_Sesion: sessionId,
      Fecha: dateKey,
      HoraInicio: workout.startedAt,
    }, `workout-start:${workout.workoutId}`);
  }

  private async completeSeries(sessionId: string, exerciseId: string, dateKey: string, seriesNumber: number, set: LocalSet): Promise<void> {
    await this.ensureWorkoutStarted(sessionId, dateKey);
    const workout = this.store.activeWorkout!;
    const plan = this.store.bootstrap!.ejercicios.find(item => item.ID_EjercicioPlan === exerciseId)!;
    const row = {
      ID_RegistroSerie: `RS-${workout.workoutId}-${exerciseId}-S${seriesNumber}`,
      ID_Entrenamiento: workout.workoutId,
      ID_EjercicioPlan: exerciseId,
      Fecha: dateKey,
      Timestamp: new Date().toISOString(),
      NumeroSerie: seriesNumber,
      Peso: set.weight,
      RepsRealizadas: set.reps,
      RIRReal: set.rir,
      ComentarioSerie: '',
      Completada: true,
      NombreEjercicioReal: plan.NombreEjercicio,
      GrupoMuscularReal: plan.GrupoMuscular,
      RevisionCliente: set.revision,
    };
    await this.sync.enqueue({ type: 'seriesUpsert', row, exercise: { ComentarioGeneral: '' } }, `series:${workout.workoutId}:${exerciseId}:${seriesNumber}`);
    const total = numberValue(plan.SeriesObjetivo, 1);
    const next = seriesNumber < total ? `S${seriesNumber + 1}` : 'Siguiente ejercicio';
    await this.timer.start(numberValue(plan.DescansoSegundos, 90), String(plan.NombreEjercicio), next);
    this.toast(`Serie ${seriesNumber} guardada`);
    this.store.notify();
  }

  private async toggleWarmup(id: string): Promise<void> {
    const route = this.store.route;
    if (route.name !== 'workout') return;
    await this.ensureWorkoutStarted(route.sessionId, route.dateKey);
    const workout = this.store.activeWorkout!;
    const active = new Set(workout.warmupsDone);
    if (active.has(id)) active.delete(id); else active.add(id);
    await this.store.updateWorkout(current => { current.warmupsDone = [...active]; });
    await this.sync.enqueue({
      type: 'warmupBatch',
      ID_Entrenamiento: workout.workoutId,
      ID_Sesion: route.sessionId,
      Fecha: route.dateKey,
      rows: [{
        ID_RegistroCalentamiento: `WARM-${workout.workoutId}-${id}`,
        ID_Entrenamiento: workout.workoutId,
        ID_Sesion: route.sessionId,
        Fecha: route.dateKey,
        ID_Calentamiento: id,
        Completado: active.has(id),
      }],
    }, `warmup:${workout.workoutId}:${id}`);
  }

  private updateSync(state: SyncState): void {
    if (!state.connected) this.store.syncLabel = `Sin conexión · ${state.pending}`;
    else if (state.syncing) this.store.syncLabel = 'Sincronizando…';
    else if (state.pending) this.store.syncLabel = `${state.pending} pendiente${state.pending === 1 ? '' : 's'}`;
    else this.store.syncLabel = 'Todo guardado';
    this.updateSyncPills(state);
  }

  private updateSyncPills(state: SyncState): void {
    document.querySelectorAll<HTMLElement>('.sync-pill').forEach(pill => {
      pill.classList.toggle('offline', !state.connected);
      pill.classList.toggle('pending', state.connected && state.pending > 0);
      const text = pill.querySelector('span:last-child');
      if (text) text.textContent = this.store.syncLabel;
    });
  }

  private renderTimer(): void {
    const slot = document.getElementById('timer-slot');
    if (!slot) return;
    const timer = this.store.restTimer;
    if (!timer.active && timer.remaining <= 0) { slot.innerHTML = ''; return; }
    const min = Math.floor(timer.remaining / 60);
    const sec = String(timer.remaining % 60).padStart(2, '0');
    slot.innerHTML = `<div class="timer-dock"><div class="timer-time">${min}:${sec}</div><div class="timer-info"><strong>${timer.exerciseName || 'Descanso'}</strong><small>${timer.remaining ? timer.nextSetLabel : 'Descanso terminado'}</small></div><div class="timer-actions"><button data-timer-add>+15</button><button data-timer-skip>${icon('x',18)}</button></div></div>`;
    slot.querySelector('[data-timer-add]')?.addEventListener('click', () => void this.timer.add(15));
    slot.querySelector('[data-timer-skip]')?.addEventListener('click', () => void this.timer.skip());
  }

  private renderModal(): void {
    const slot = document.getElementById('modal-slot');
    if (!slot) return;
    if (!this.modal) { slot.innerHTML = ''; return; }
    if (this.modal === 'sync') {
      const state = this.sync.state();
      slot.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" onclick="event.stopPropagation()"><h2>Sincronización</h2><section class="card card-body"><div class="session-row" style="padding:0"><div class="session-icon">${icon(state.connected ? 'cloud' : 'wifi-off')}</div><div class="session-info"><strong>${state.connected ? 'Con conexión' : 'Sin conexión'}</strong><small>${state.pending} cambios pendientes · ${state.failed} con error</small></div></div></section><div style="height:12px"></div><button class="primary full" data-action="sync-now">Sincronizar ahora</button><div style="height:10px"></div><button class="secondary full" data-close-modal>Cerrar</button></section></div>`;
      slot.querySelector('[data-action="sync-now"]')?.addEventListener('click', () => void this.sync.retryAll().then(() => this.toast('Sincronización iniciada')));
    }
    if (this.modal === 'cardio') {
      slot.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" onclick="event.stopPropagation()"><h2>Añadir actividad</h2><div class="form-group"><label>Tipo</label><select id="cardio-type" class="select-input"><option>Caminar</option><option>Nadar</option><option>Bici</option><option>Correr</option><option>Otro</option></select></div><div class="button-row"><div class="form-group"><label>Minutos</label><input id="cardio-min" class="text-input" type="number" value="30"></div><div class="form-group"><label>Pasos</label><input id="cardio-steps" class="text-input" type="number" placeholder="Opcional"></div></div><div class="form-group"><label>Distancia km</label><input id="cardio-distance" class="text-input" type="number" step="0.1" placeholder="Opcional"></div><button class="primary full" data-action="save-cardio">Guardar actividad</button><div style="height:10px"></div><button class="secondary full" data-close-modal>Cancelar</button></section></div>`;
      slot.querySelector('[data-action="save-cardio"]')?.addEventListener('click', () => void this.saveCardio());
    }
    if (this.modal === 'finish') {
      slot.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" onclick="event.stopPropagation()"><h2>Finalizar entrenamiento</h2><p style="color:var(--muted);line-height:1.5">Puedes terminar aunque falten ejercicios. Las series guardadas se usarán para el resumen y la siguiente escalera.</p><div class="button-row" style="margin-top:18px"><div class="form-group"><label>Energía 1-5</label><input id="finish-energy" class="text-input" type="number" min="1" max="5" value="3"></div><div class="form-group"><label>Dificultad 1-5</label><input id="finish-difficulty" class="text-input" type="number" min="1" max="5" value="3"></div></div><div class="form-group"><label>Molestias 0-3</label><input id="finish-pain" class="text-input" type="number" min="0" max="3" value="0"></div><div class="form-group"><label>Comentario</label><textarea id="finish-comment" class="textarea" placeholder="Sensaciones, técnica o cambios para la próxima sesión"></textarea></div><button class="primary full" data-action="confirm-finish">Guardar y finalizar</button><div style="height:10px"></div><button class="secondary full" data-close-modal>Seguir entrenando</button></section></div>`;
      slot.querySelector('[data-action="confirm-finish"]')?.addEventListener('click', () => void this.finishWorkout());
    }
    slot.querySelectorAll('[data-close-modal]').forEach(element => element.addEventListener('click', () => { this.modal = ''; this.renderModal(); }));
  }

  private async saveCardio(): Promise<void> {
    const route = this.store.route;
    if (route.name !== 'day') return;
    const type = (document.getElementById('cardio-type') as HTMLSelectElement).value;
    const duration = Number((document.getElementById('cardio-min') as HTMLInputElement).value || 0);
    const steps = Number((document.getElementById('cardio-steps') as HTMLInputElement).value || 0);
    const distance = Number((document.getElementById('cardio-distance') as HTMLInputElement).value || 0);
    const id = `CARDIO-${route.dateKey}-${Date.now()}`;
    await this.sync.enqueue({ type: 'calendar', activity: { ID_Actividad: id, Fecha: route.dateKey, Categoria: 'cardio', Tipo: type, DuracionMin: duration, Pasos: steps || '', DistanciaKm: distance || '', Estado: new Date(`${route.dateKey}T23:59:59`) > new Date() ? 'planificado' : 'hecho' } }, `calendar:${id}`);
    this.modal = '';
    this.toast('Actividad guardada');
    this.render();
  }

  private async finishWorkout(): Promise<void> {
    const route = this.store.route;
    if (route.name !== 'workout' || !this.store.activeWorkout) return;
    await this.sync.flush();
    const workout = this.store.activeWorkout;
    const totalRest = 0;
    await this.sync.enqueue({
      type: 'finishWorkout',
      ID_Entrenamiento: workout.workoutId,
      ID_Sesion: route.sessionId,
      Fecha: route.dateKey,
      HoraInicio: workout.startedAt,
      Energia: Number((document.getElementById('finish-energy') as HTMLInputElement).value || 3),
      Dificultad: Number((document.getElementById('finish-difficulty') as HTMLInputElement).value || 3),
      Molestias: Number((document.getElementById('finish-pain') as HTMLInputElement).value || 0),
      ComentarioFinal: (document.getElementById('finish-comment') as HTMLTextAreaElement).value,
      TiempoDescansoSeg: totalRest,
    }, `finish:${workout.workoutId}`);
    await this.timer.skip();
    await this.store.clearWorkout();
    this.modal = '';
    this.toast('Entrenamiento finalizado');
    await this.loadData();
    this.store.navigate({ name: 'home' });
  }

  private async testApi(): Promise<void> {
    try { const ok = await this.api.ping(); this.toast(ok ? 'Conexión correcta' : 'Sin respuesta', ok ? undefined : 'error'); }
    catch (error) { this.toast(error instanceof Error ? error.message : String(error), 'error'); }
  }

  private async requestNotifications(): Promise<void> {
    const ok = await this.timer.requestPermission();
    this.toast(ok ? 'Notificaciones activadas' : 'Permiso no concedido', ok ? undefined : 'error');
  }

  private toast(message: string, type?: 'error'): void {
    const element = document.getElementById('toast');
    if (!element) return;
    window.clearTimeout(this.toastTimer);
    element.textContent = message;
    element.className = `toast show ${type || ''}`;
    this.toastTimer = window.setTimeout(() => { element.className = 'toast'; }, 2600);
  }

  private escape(value: string): string {
    return value.replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]!);
  }
}
