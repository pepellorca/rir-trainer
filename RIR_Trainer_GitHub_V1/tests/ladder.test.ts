import { describe, expect, it } from 'vitest';
import { buildLadderPlan, nextSetAdvice } from '../src/logic/ladder';
import type { ExercisePlanRow, SeriesRow } from '../src/types';

const plan: ExercisePlanRow = {
  ID_EjercicioPlan: 'M6-S2-D1-E01',
  ID_Sesion: 'M6-S2-D1',
  NombreEjercicio: 'Sentadilla con barra',
  SeriesObjetivo: 3,
  RepsObjetivo: '6-8',
  RIRObjetivo: '3-2',
  IncrementoCarga: 2,
  ReduccionCarga: 2,
  PesoActual: 70,
};

function rows(weights: number[], reps: number[]): SeriesRow[] {
  return weights.map((weight, index) => ({
    ID_RegistroSerie: `R${index}`,
    ID_EjercicioPlan: 'OLD',
    ID_Entrenamiento: 'W1',
    Fecha: '2026-06-29',
    Timestamp: `2026-06-29T10:0${index}:00`,
    NumeroSerie: index + 1,
    Peso: weight,
    RepsRealizadas: reps[index],
    RIRReal: index === 2 ? 1 : 2,
    Completada: true,
    NombreEjercicioReal: 'Sentadilla con barra',
  }));
}

describe('escalera de cargas', () => {
  it('extiende la carga alta a la segunda serie', () => {
    expect(buildLadderPlan(plan, rows([74, 72, 70], [7, 8, 8])).weights).toEqual([74, 74, 70]);
  });

  it('extiende la carga alta a la tercera serie', () => {
    expect(buildLadderPlan(plan, rows([74, 74, 72], [7, 7, 8])).weights).toEqual([74, 74, 74]);
  });

  it('sube únicamente S1 cuando la carga está consolidada', () => {
    expect(buildLadderPlan(plan, rows([74, 74, 74], [7, 7, 6])).weights).toEqual([76, 74, 74]);
  });

  it('no baja por RIR bajo si las repeticiones están en rango', () => {
    const ladder = buildLadderPlan(plan, rows([74, 72, 70], [7, 8, 8]));
    const advice = nextSetAdvice(plan, ladder, [{ seriesNumber: 1, weight: 74, reps: 6, rir: 0, completed: true, revision: 1, synced: true }], 1);
    expect(advice.weight).toBe(74);
  });

  it('reduce la siguiente serie cuando no alcanza el mínimo', () => {
    const ladder = buildLadderPlan(plan, rows([74, 72, 70], [7, 8, 8]));
    const advice = nextSetAdvice(plan, ladder, [{ seriesNumber: 1, weight: 76, reps: 5, rir: 0, completed: true, revision: 1, synced: true }], 1);
    expect(advice.weight).toBe(74);
    expect(advice.tone).toBe('reduce');
  });
});
