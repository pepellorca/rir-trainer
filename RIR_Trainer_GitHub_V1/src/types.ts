export type SheetRow = Record<string, string | number | boolean | null | undefined>;

export interface ConfigRow extends SheetRow {
  MesocicloActual?: string;
  FechaInicio?: string;
  NumeroSemanas?: number | string;
  IncrementoTrenSuperior?: number | string;
  IncrementoTrenInferior?: number | string;
  IncrementoAccesorios?: number | string;
}

export interface SessionRow extends SheetRow {
  ID_Sesion: string;
  ID_Mesociclo?: string;
  Semana?: number | string;
  Dia?: string;
  NombreSesion?: string;
  Estado?: string;
  FechaRealizacion?: string;
}

export interface ExercisePlanRow extends SheetRow {
  ID_EjercicioPlan: string;
  ID_Sesion: string;
  Orden?: number | string;
  NombreEjercicio?: string;
  GrupoMuscular?: string;
  SeriesObjetivo?: number | string;
  RepsObjetivo?: string | number;
  RIRObjetivo?: string | number;
  DescansoSegundos?: number | string;
  PesoActual?: number | string;
  IncrementoCarga?: number | string;
  ReduccionCarga?: number | string;
  TipoProgresion?: string;
  UnidadCarga?: string;
  TipoEquipo?: string;
  NotasEntrenador?: string;
  URLVideo?: string;
}

export interface SeriesRow extends SheetRow {
  ID_RegistroSerie: string;
  ID_EjercicioPlan: string;
  ID_Entrenamiento?: string;
  Fecha?: string;
  Timestamp?: string;
  NumeroSerie?: number | string;
  Peso?: number | string;
  RepsRealizadas?: number | string;
  RIRReal?: number | string;
  ComentarioSerie?: string;
  Completada?: boolean | string;
  NombreEjercicioReal?: string;
  GrupoMuscularReal?: string;
  RevisionCliente?: number | string;
}

export interface ExerciseRecordRow extends SheetRow {
  ID_RegistroEjercicio: string;
  ID_EjercicioPlan: string;
  ID_Entrenamiento?: string;
  Fecha?: string;
  EjercicioCompletado?: boolean | string;
  ComentarioGeneral?: string;
}

export interface WorkoutRow extends SheetRow {
  ID_Entrenamiento: string;
  ID_Sesion: string;
  Fecha?: string;
  HoraInicio?: string;
  HoraFin?: string;
  DuracionMin?: number | string;
  Estado?: string;
  SeriesRealizadas?: number | string;
  VolumenKg?: number | string;
  RIRMedio?: number | string;
  DecisionesProximaSesion?: string;
}

export interface CalendarActivityRow extends SheetRow {
  ID_Actividad: string;
  Fecha?: string;
  Categoria?: string;
  Tipo?: string;
  Detalle?: string;
  DuracionMin?: number | string;
  DistanciaKm?: number | string;
  Pasos?: number | string;
  Estado?: string;
  ID_Sesion?: string;
  ID_Entrenamiento?: string;
}

export interface WarmupRow extends SheetRow {
  ID_Calentamiento: string;
  Entorno?: string;
  SesionTipo?: string;
  Orden?: number | string;
  Tipo?: string;
  Nombre?: string;
  RepsDuracion?: string;
  Detalle?: string;
  ModoCalculo?: string;
  SerieReferencia?: string;
  PorcentajesCarga?: string;
  RepsAproximacion?: string;
  URLVideo?: string;
  Activo?: boolean | string;
}

export interface WarmupRecordRow extends SheetRow {
  ID_RegistroCalentamiento: string;
  ID_Entrenamiento: string;
  ID_Calentamiento: string;
  Completado?: boolean | string;
}

export interface MeasureRow extends SheetRow {
  Fecha?: string;
  Peso?: number | string;
  Cintura?: number | string;
  Gluteo?: number | string;
  Muslo?: number | string;
  MusloMedio?: number | string;
  Biceps?: number | string;
  Pecho?: number | string;
}

export interface BootstrapData {
  ok: boolean;
  user?: { email?: string };
  serverTime?: string;
  config: ConfigRow[];
  sesiones: SessionRow[];
  ejercicios: ExercisePlanRow[];
  registroSeries: SeriesRow[];
  registroEjercicios: ExerciseRecordRow[];
  registroEntrenamientos: WorkoutRow[];
  calendarioActividades: CalendarActivityRow[];
  calentamientos: WarmupRow[];
  registroCalentamientos: WarmupRecordRow[];
  sustituciones: SheetRow[];
  mapaMuscular: SheetRow[];
  medidas: MeasureRow[];
}

export interface AppSettings {
  apiUrl: string;
  apiToken: string;
  demoMode: boolean;
  restCountdownSeconds: 3 | 5;
  notificationsEnabled: boolean;
  defaultEnvironment: 'Casa' | 'Gimnasio' | 'Viaje';
}

export type SyncJobState = 'pending' | 'syncing' | 'failed';

export interface SyncJob {
  id: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  state: SyncJobState;
  lastError?: string;
}

export interface LocalSet {
  seriesNumber: number;
  weight: number;
  reps: number;
  rir: number;
  completed: boolean;
  revision: number;
  synced: boolean;
}

export interface ActiveWorkout {
  workoutId: string;
  sessionId: string;
  dateKey: string;
  startedAt: string;
  selectedExerciseId?: string;
  setsByExercise: Record<string, LocalSet[]>;
  warmupsDone: string[];
}

export interface RestTimerState {
  active: boolean;
  endAt: number;
  totalSeconds: number;
  exerciseName: string;
  nextSetLabel: string;
  notificationId: number;
}

export type Route =
  | { name: 'home' }
  | { name: 'day'; dateKey: string }
  | { name: 'workout'; sessionId: string; dateKey: string }
  | { name: 'exercise'; sessionId: string; exerciseId: string; dateKey: string }
  | { name: 'progress' }
  | { name: 'settings' };
