import {
  type SolverResult,
  type IterationStep,
  type ProblemInput,
  type Constraint,
} from "./dualSimplex";

/**
 * Z-value progression data point
 */
export interface ZProgressionData {
  iteration: number;
  zValue: number;
  explanation: string;
}

/**
 * Variable values at iteration data point
 */
export interface VariableData {
  iteration: number;
  [varName: string]: number | string;
}

/**
 * Basis history entry
 */
export interface BasisHistoryEntry {
  iteration: number;
  basisVariables: string[];
  enteringVariable?: string;
  leavingVariable?: string;
  rhsValues?: number[];
}

/**
 * Constraint line for plotting
 */
export interface ConstraintPlotData {
  name: string;
  type: string;
  coefficients: number[];
  rhs: number;
  points: Array<{ x: number; y: number }>;
  inequality: string;
}

/**
 * Extract Z-value progression across iterations
 */
export function extractZProgression(result: SolverResult): ZProgressionData[] {
  const data: ZProgressionData[] = [];

  result.steps.forEach((step, idx) => {
    const objRowIdx = step.table.length - 1;
    const zValue = step.table[objRowIdx][step.table[objRowIdx].length - 1];

    data.push({
      iteration: idx,
      zValue: Math.round(zValue * 10000) / 10000,
      explanation: step.explanation,
    });
  });

  return data;
}

/**
 * Extract variable values across iterations
 */
export function extractVariableProgression(
  result: SolverResult,
  numVariables: number
): VariableData[] {
  const data: VariableData[] = [];

  result.steps.forEach((step, stepIdx) => {
    const varData: VariableData = { iteration: stepIdx };

    // Get RHS values (last column)
    const totalVars = step.headers.length - 1; // exclude RHS header
    for (let i = 0; i < numVariables; i++) {
      const varName = `x${i + 1}`;
      const basicIdx = step.basicVariables.indexOf(varName);

      if (basicIdx !== -1) {
        const value = step.table[basicIdx][totalVars];
        varData[varName] = Math.round(value * 10000) / 10000;
      } else {
        varData[varName] = 0;
      }
    }

    data.push(varData);
  });

  return data;
}

/**
 * Extract basis variable history
 */
export function extractBasisHistory(result: SolverResult): BasisHistoryEntry[] {
  const history: BasisHistoryEntry[] = [];

  let prevBasis: string[] = [];

  result.steps.forEach((step, idx) => {
    const objRowIdx = step.table.length - 1;
    const rhsValues = step.table.map(
      (row) => Math.round(row[row.length - 1] * 10000) / 10000
    );

    let enteringVar: string | undefined;
    let leavingVar: string | undefined;

    // Find entering and leaving variables
    if (prevBasis.length > 0) {
      for (const varName of step.basicVariables) {
        if (!prevBasis.includes(varName)) {
          enteringVar = varName;
        }
      }
      for (const varName of prevBasis) {
        if (!step.basicVariables.includes(varName)) {
          leavingVar = varName;
        }
      }
    }

    history.push({
      iteration: idx,
      basisVariables: [...step.basicVariables],
      enteringVariable: enteringVar,
      leavingVariable: leavingVar,
      rhsValues: rhsValues.slice(0, -1), // exclude Z-row
    });

    prevBasis = [...step.basicVariables];
  });

  return history;
}

/**
 * Extract constraint information for plotting feasible region (2D only)
 */
export function extractConstraintPlotData(
  input: ProblemInput,
  result: SolverResult
): ConstraintPlotData[] {
  if (input.numVariables !== 2) {
    return [];
  }

  const constraints = input.constraints;
  const plotDataList: ConstraintPlotData[] = [];

  // Determine axis bounds based on solution
  let maxX1 = 10,
    maxX2 = 10;

  if (result.solution) {
    maxX1 = Math.max(maxX1, (result.solution.variables["x1"] || 0) * 1.5 + 2);
    maxX2 = Math.max(maxX2, (result.solution.variables["x2"] || 0) * 1.5 + 2);
  }

  constraints.forEach((constraint, idx) => {
    const [a, b] = constraint.coefficients;
    const c = constraint.rhs;
    const inequality = constraint.inequality;

    // Generate line points: a*x1 + b*x2 = c
    const points: Array<{ x: number; y: number }> = [];

    if (Math.abs(b) > 1e-10) {
      // x2 = (c - a*x1) / b
      for (let x1 = 0; x1 <= maxX1; x1 += maxX1 / 20) {
        const x2 = (c - a * x1) / b;
        if (x2 >= -0.5) {
          points.push({ x: x1, y: x2 });
        }
      }
    } else if (Math.abs(a) > 1e-10) {
      // x1 = c / a (vertical line)
      const x1 = c / a;
      for (let x2 = 0; x2 <= maxX2; x2 += maxX2 / 20) {
        points.push({ x: x1, y: x2 });
      }
    }

    plotDataList.push({
      name: `Constraint ${idx + 1}`,
      type: inequality,
      coefficients: [a, b],
      rhs: c,
      points,
      inequality,
    });
  });

  return plotDataList;
}

/**
 * Get iteration points (x1, x2 values from each step)
 */
export function extractIterationPoints(
  result: SolverResult
): Array<{ iteration: number; x1: number; x2: number }> {
  const points: Array<{ iteration: number; x1: number; x2: number }> = [];

  result.steps.forEach((step, idx) => {
    const totalVars = step.headers.length - 1;
    const x1Idx = step.basicVariables.indexOf("x1");
    const x2Idx = step.basicVariables.indexOf("x2");

    const x1 = x1Idx !== -1 ? step.table[x1Idx][totalVars] : 0;
    const x2 = x2Idx !== -1 ? step.table[x2Idx][totalVars] : 0;

    points.push({
      iteration: idx,
      x1: Math.round(x1 * 10000) / 10000,
      x2: Math.round(x2 * 10000) / 10000,
    });
  });

  return points;
}

/**
 * Format number for display
 */
export function formatNumber(val: number): string {
  const rounded = Math.round(val * 10000) / 10000;
  if (rounded === 0) return "0";
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}
