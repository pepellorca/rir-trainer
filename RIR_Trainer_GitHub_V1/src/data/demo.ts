import type { BootstrapData, ExercisePlanRow, SessionRow } from '../types';

const sessions: SessionRow[] = [];
const exercises: ExercisePlanRow[] = [];
for (let week = 1; week <= 6; week += 1) {
  for (const day of ['D1', 'D2', 'D3'] as const) {
    const sessionId = `M6-S${week}-${day}`;
    sessions.push({
      ID_Sesion: sessionId,
      ID_Mesociclo: 'M6',
      Semana: week,
      Dia: day,
      NombreSesion: day === 'D1'
        ? 'Full Body A · Sentadilla y Pecho'
        : day === 'D2'
          ? 'Full Body B · Banca y Espalda'
          : 'Full Body C · Vertical y Posterior',
      Estado: 'No empezada',
    });
    const templates = day === 'D1'
      ? [
          ['Sentadilla con barra', 'Cuádriceps', 3, '6-8', '3-2', 150, 74, 2],
          ['Press banca', 'Pecho', 3, '6-8', '3-2', 150, 70, 2],
          ['Remo con barra', 'Espalda', 3, '8-10', '2-1', 120, 55, 2.5],
        ]
      : day === 'D2'
        ? [
            ['Press banca con pausa', 'Pecho', 3, '6-8', '3-2', 150, 68, 2],
            ['Dominada prona lastrada', 'Espalda', 2, '4-7', '2-1', 150, 12, 1],
            ['Peso muerto rumano', 'Isquio', 3, '8-10', '2-1', 150, 70, 5],
          ]
        : [
            ['Peso muerto', 'Isquio', 3, '5-7', '3-2', 180, 80, 5],
            ['Press militar', 'Hombro', 3, '6-8', '2-1', 120, 35, 2],
            ['Jalón al pecho', 'Espalda', 3, '8-10', '2-1', 120, 55, 2.5],
          ];
    templates.forEach((template, index) => {
      exercises.push({
        ID_EjercicioPlan: `${sessionId}-E${String(index + 1).padStart(2, '0')}`,
        ID_Sesion: sessionId,
        Orden: index + 1,
        NombreEjercicio: String(template[0]),
        GrupoMuscular: String(template[1]),
        SeriesObjetivo: Number(template[2]),
        RepsObjetivo: String(template[3]),
        RIRObjetivo: String(template[4]),
        DescansoSegundos: Number(template[5]),
        PesoActual: Number(template[6]),
        IncrementoCarga: Number(template[7]),
        ReduccionCarga: Number(template[7]),
        TipoProgresion: 'Escalera',
        UnidadCarga: String(template[0]).includes('Dominada') ? 'kg de lastre' : 'kg totales',
        NotasEntrenador: 'Técnica controlada y rango completo.',
      });
    });
  }
}

const start = new Date();
start.setDate(start.getDate() - 7);
const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

export const demoBootstrap: BootstrapData = {
  ok: true,
  user: { email: 'demo@rirtrainer.local' },
  serverTime: new Date().toISOString(),
  config: [{ MesocicloActual: 'M6', FechaInicio: startKey, NumeroSemanas: 6 }],
  sesiones: sessions,
  ejercicios: exercises,
  registroSeries: [
    { ID_RegistroSerie: 'DEMO-1', ID_EjercicioPlan: 'M6-S1-D1-E01', ID_Entrenamiento: 'DEMO-W1', Fecha: startKey, Timestamp: `${startKey}T10:00:00`, NumeroSerie: 1, Peso: 74, RepsRealizadas: 7, RIRReal: 2, Completada: true, NombreEjercicioReal: 'Sentadilla con barra' },
    { ID_RegistroSerie: 'DEMO-2', ID_EjercicioPlan: 'M6-S1-D1-E01', ID_Entrenamiento: 'DEMO-W1', Fecha: startKey, Timestamp: `${startKey}T10:04:00`, NumeroSerie: 2, Peso: 72, RepsRealizadas: 8, RIRReal: 2, Completada: true, NombreEjercicioReal: 'Sentadilla con barra' },
    { ID_RegistroSerie: 'DEMO-3', ID_EjercicioPlan: 'M6-S1-D1-E01', ID_Entrenamiento: 'DEMO-W1', Fecha: startKey, Timestamp: `${startKey}T10:08:00`, NumeroSerie: 3, Peso: 70, RepsRealizadas: 8, RIRReal: 1, Completada: true, NombreEjercicioReal: 'Sentadilla con barra' },
  ],
  registroEjercicios: [],
  registroEntrenamientos: [{ ID_Entrenamiento: 'DEMO-W1', ID_Sesion: 'M6-S1-D1', Fecha: startKey, Estado: 'Completada', SeriesRealizadas: 9, VolumenKg: 4200 }],
  calendarioActividades: [{ ID_Actividad: 'DEMO-CAL-1', Fecha: startKey, Categoria: 'fuerza', Tipo: 'D1', Estado: 'hecho', ID_Sesion: 'M6-S1-D1', ID_Entrenamiento: 'DEMO-W1' }],
  calentamientos: [
    { ID_Calentamiento: 'W-CASA-D1-01', Entorno: 'Casa', SesionTipo: 'D1', Orden: 1, Tipo: 'Estabilidad', Nombre: 'Estabilidad de pie', RepsDuracion: '10 por pierna', Activo: true },
    { ID_Calentamiento: 'W-CASA-D1-02', Entorno: 'Casa', SesionTipo: 'D1', Orden: 2, Tipo: 'Movilidad', Nombre: 'Cadera sentado', RepsDuracion: '8 por pierna', Activo: true },
    { ID_Calentamiento: 'W-CASA-D1-03', Entorno: 'Casa', SesionTipo: 'D1', Orden: 3, Tipo: 'Movilidad', Nombre: 'Isquio tumbado estático', RepsDuracion: '8 repeticiones', Activo: true },
    { ID_Calentamiento: 'W-CASA-D1-04', Entorno: 'Casa', SesionTipo: 'D1', Orden: 4, Tipo: 'Core', Nombre: 'Dead Bug progresiones', RepsDuracion: '10-20 repeticiones', Activo: true },
    { ID_Calentamiento: 'W-CASA-D1-05', Entorno: 'Casa', SesionTipo: 'D1', Orden: 5, Tipo: 'Isométrico', Nombre: 'Sentadilla ISO 2P', RepsDuracion: '2 × 20 s', Activo: true },
    { ID_Calentamiento: 'W-CASA-D2-01', Entorno: 'Casa', SesionTipo: 'D2', Orden: 1, Tipo: 'Movilidad', Nombre: 'Mahometano', RepsDuracion: '5 repeticiones', Activo: true },
    { ID_Calentamiento: 'W-CASA-D2-02', Entorno: 'Casa', SesionTipo: 'D2', Orden: 2, Tipo: 'Movilidad', Nombre: 'Gato', RepsDuracion: '8 repeticiones', Activo: true },
    { ID_Calentamiento: 'W-CASA-D2-03', Entorno: 'Casa', SesionTipo: 'D2', Orden: 3, Tipo: 'Movilidad', Nombre: 'Rotación torácica HK', RepsDuracion: '8 por brazo', Activo: true },
    { ID_Calentamiento: 'W-CASA-D2-04', Entorno: 'Casa', SesionTipo: 'D2', Orden: 4, Tipo: 'Core', Nombre: 'Bear Climber', RepsDuracion: '2 × 10-20', Activo: true },
    { ID_Calentamiento: 'W-CASA-D2-05', Entorno: 'Casa', SesionTipo: 'D2', Orden: 5, Tipo: 'Activación', Nombre: 'Colgada activa', RepsDuracion: 'Máximo tiempo', Activo: true },
  ],
  registroCalentamientos: [],
  sustituciones: [],
  mapaMuscular: [],
  medidas: [],
};
