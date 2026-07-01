import type { ActiveWorkout, AppSettings, BootstrapData, LocalSet, RestTimerState, Route } from '../types';
import { storage } from '../services/storage';

const SETTINGS_KEY = 'rir.settings.v8';
const BOOTSTRAP_KEY = 'rir.bootstrap.v8';
const WORKOUT_KEY = 'rir.active-workout.v8';

export const defaultSettings: AppSettings = {
  apiUrl: '',
  apiToken: '',
  demoMode: true,
  restCountdownSeconds: 5,
  notificationsEnabled: true,
  defaultEnvironment: 'Casa',
};

type Listener = () => void;

export class AppStore {
  settings: AppSettings = { ...defaultSettings };
  bootstrap?: BootstrapData;
  route: Route = { name: 'home' };
  activeWorkout?: ActiveWorkout;
  selectedWeekAnchor = new Date();
  loading = true;
  error = '';
  syncLabel = 'Preparando…';
  restTimer: RestTimerState & { remaining: number } = {
    active: false, endAt: 0, totalSeconds: 0, exerciseName: '', nextSetLabel: '', notificationId: 7301, remaining: 0,
  };
  private listeners = new Set<Listener>();

  async init(): Promise<void> {
    this.settings = await storage.get<AppSettings>(SETTINGS_KEY, { ...defaultSettings });
    this.bootstrap = await storage.get<BootstrapData | undefined>(BOOTSTRAP_KEY, undefined);
    this.activeWorkout = await storage.get<ActiveWorkout | undefined>(WORKOUT_KEY, undefined);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void { this.listeners.forEach(listener => listener()); }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.settings = settings;
    await storage.set(SETTINGS_KEY, settings);
    this.notify();
  }

  async setBootstrap(data: BootstrapData): Promise<void> {
    this.bootstrap = data;
    await storage.set(BOOTSTRAP_KEY, data);
    this.notify();
  }

  navigate(route: Route): void {
    this.route = route;
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.notify();
  }

  async startWorkout(sessionId: string, dateKey: string): Promise<ActiveWorkout> {
    if (this.activeWorkout?.sessionId === sessionId && this.activeWorkout.dateKey === dateKey) return this.activeWorkout;
    const existingWorkout = this.bootstrap?.registroEntrenamientos.find(row =>
      row.ID_Sesion === sessionId && String(row.Fecha || '').slice(0, 10) === dateKey
    );
    const workoutId = existingWorkout?.ID_Entrenamiento || `ENT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const exerciseIds = new Set((this.bootstrap?.ejercicios || []).filter(row => row.ID_Sesion === sessionId).map(row => row.ID_EjercicioPlan));
    const historicSeries = (this.bootstrap?.registroSeries || []).filter(row =>
      (String(row.ID_Entrenamiento || '') === workoutId || (!row.ID_Entrenamiento && String(row.Fecha || '').slice(0, 10) === dateKey)) &&
      exerciseIds.has(String(row.ID_EjercicioPlan))
    );
    const setsByExercise: Record<string, LocalSet[]> = {};
    for (const row of historicSeries) {
      const id = String(row.ID_EjercicioPlan);
      const list = setsByExercise[id] ?? [];
      const set: LocalSet = {
        seriesNumber: Number(row.NumeroSerie || list.length + 1),
        weight: Number(String(row.Peso || 0).replace(',', '.')),
        reps: Number(row.RepsRealizadas || 0),
        rir: Number(row.RIRReal || 0),
        completed: row.Completada === true || String(row.Completada).toLowerCase() === 'true',
        revision: Number(row.RevisionCliente || 0),
        synced: true,
      };
      list[set.seriesNumber - 1] = set;
      setsByExercise[id] = list;
    }
    const warmupsDone = (this.bootstrap?.registroCalentamientos || [])
      .filter(row => row.ID_Entrenamiento === workoutId && (row.Completado === true || String(row.Completado).toLowerCase() === 'true'))
      .map(row => row.ID_Calentamiento);
    this.activeWorkout = {
      workoutId,
      sessionId,
      dateKey,
      startedAt: String(existingWorkout?.HoraInicio || new Date().toISOString()),
      setsByExercise,
      warmupsDone,
    };
    await storage.set(WORKOUT_KEY, this.activeWorkout);
    this.notify();
    return this.activeWorkout;
  }

  async updateWorkout(mutator: (workout: ActiveWorkout) => void): Promise<void> {
    if (!this.activeWorkout) return;
    mutator(this.activeWorkout);
    await storage.set(WORKOUT_KEY, this.activeWorkout);
    this.notify();
  }

  async clearWorkout(): Promise<void> {
    this.activeWorkout = undefined;
    await storage.remove(WORKOUT_KEY);
    this.notify();
  }

  setsFor(exerciseId: string): LocalSet[] {
    return this.activeWorkout?.setsByExercise[exerciseId] ?? [];
  }
}
