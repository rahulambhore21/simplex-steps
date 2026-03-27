/**
 * Dual Simplex Method Solver
 * Solves Linear Programming problems step-by-step.
 */

export type ObjectiveType = "min" | "max";
export type InequalityType = ">=" | "<=" | "=";

export interface Constraint {
  coefficients: number[];
  inequality: InequalityType;
  rhs: number;
}

export interface ProblemInput {
  objectiveType: ObjectiveType;
  objectiveCoefficients: number[];
  constraints: Constraint[];
  numVariables: number;
}

export interface IterationStep {
  table: number[][];
  headers: string[];
  basicVariables: string[];
  pivotRow: number | null;
  pivotCol: number | null;
  explanation: string;
}

export interface Solution {
  variables: Record<string, number>;
  optimalValue: number;
}

export interface SolverResult {
  standardForm: string[];
  steps: IterationStep[];
  solution: Solution | null;
  error: string | null;
}

/**
 * Convert the problem to standard form for Dual Simplex.
 * - Maximize → negate objective for dual simplex on min problems
 * - >= constraints → multiply by -1 and add slack
 * - <= constraints → add slack directly
 * - = constraints → add artificial handling
 */
export function solveDualSimplex(input: ProblemInput): SolverResult {
  const { objectiveType, objectiveCoefficients, constraints, numVariables } = input;
  const steps: IterationStep[] = [];
  const standardFormLines: string[] = [];

  // Number of slack/surplus variables = number of constraints
  const numConstraints = constraints.length;
  const totalVars = numVariables + numConstraints; // decision + slack vars

  // Build variable headers
  const headers: string[] = [];
  for (let i = 0; i < numVariables; i++) {
    headers.push(`x${i + 1}`);
  }
  for (let i = 0; i < numConstraints; i++) {
    headers.push(`s${i + 1}`);
  }
  headers.push("RHS");

  // Build the initial tableau
  // Rows: constraints + objective row (last row)
  const tableau: number[][] = [];
  const basicVariables: string[] = [];

  // Standard form description
  let objStr = objectiveType === "min" ? "Minimize" : "Maximize";
  const objTerms = objectiveCoefficients.map((c, i) => {
    const sign = i === 0 ? (c < 0 ? "-" : "") : (c < 0 ? " - " : " + ");
    return `${sign}${Math.abs(c)}x${i + 1}`;
  }).join("");
  standardFormLines.push(`${objStr} Z = ${objTerms}`);
  standardFormLines.push("Subject to:");

  for (let i = 0; i < numConstraints; i++) {
    const c = constraints[i];
    const row = new Array(totalVars + 1).fill(0);

    // For dual simplex, we need all constraints as <= with non-negative RHS ideally,
    // but dual simplex works when RHS can be negative.
    // Convert >= to <= by multiplying by -1
    if (c.inequality === ">=") {
      for (let j = 0; j < numVariables; j++) {
        row[j] = -c.coefficients[j];
      }
      row[numVariables + i] = 1; // slack variable
      row[totalVars] = -c.rhs;

      const terms = c.coefficients.map((coef, j) => {
        const sign = j === 0 ? ((-coef) < 0 ? "-" : "") : ((-coef) < 0 ? " - " : " + ");
        return `${sign}${Math.abs(coef)}x${j + 1}`;
      }).join("");
      standardFormLines.push(`  ${terms} + s${i + 1} = ${-c.rhs}`);
    } else if (c.inequality === "<=") {
      for (let j = 0; j < numVariables; j++) {
        row[j] = c.coefficients[j];
      }
      row[numVariables + i] = 1; // slack variable
      row[totalVars] = c.rhs;

      const terms = c.coefficients.map((coef, j) => {
        const sign = j === 0 ? (coef < 0 ? "-" : "") : (coef < 0 ? " - " : " + ");
        return `${sign}${Math.abs(coef)}x${j + 1}`;
      }).join("");
      standardFormLines.push(`  ${terms} + s${i + 1} = ${c.rhs}`);
    } else {
      // = constraint: just add it, slack = 0 conceptually but we still track
      for (let j = 0; j < numVariables; j++) {
        row[j] = c.coefficients[j];
      }
      row[numVariables + i] = 1;
      row[totalVars] = c.rhs;

      const terms = c.coefficients.map((coef, j) => {
        const sign = j === 0 ? (coef < 0 ? "-" : "") : (coef < 0 ? " - " : " + ");
        return `${sign}${Math.abs(coef)}x${j + 1}`;
      }).join("");
      standardFormLines.push(`  ${terms} + s${i + 1} = ${c.rhs}`);
    }

    tableau.push(row);
    basicVariables.push(`s${i + 1}`);
  }

  // Objective row (Z row)
  // For minimization: Z - c1*x1 - c2*x2 ... = 0
  // For maximization: we negate to convert to min, then negate result
  const objRow = new Array(totalVars + 1).fill(0);
  for (let j = 0; j < numVariables; j++) {
    if (objectiveType === "min") {
      objRow[j] = objectiveCoefficients[j]; // coefficients in Z row
    } else {
      // Maximize: negate coefficients for dual simplex (convert to min)
      objRow[j] = -objectiveCoefficients[j];
    }
  }
  objRow[totalVars] = 0; // Z value
  tableau.push(objRow);

  // Record initial tableau
  steps.push({
    table: deepCopy(tableau),
    headers: [...headers],
    basicVariables: [...basicVariables],
    pivotRow: null,
    pivotCol: null,
    explanation: "Initial Simplex Tableau after converting to standard form.",
  });

  // Dual Simplex iterations
  const MAX_ITERATIONS = 50;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const numRows = tableau.length;
    const objRowIdx = numRows - 1;

    // Step 1: Find pivot row — row with most negative RHS (excluding objective row)
    let pivotRow = -1;
    let mostNegativeRHS = -1e-10; // tolerance

    for (let i = 0; i < objRowIdx; i++) {
      const rhs = tableau[i][totalVars];
      if (rhs < mostNegativeRHS) {
        mostNegativeRHS = rhs;
        pivotRow = i;
      }
    }

    // If no negative RHS, we're optimal
    if (pivotRow === -1) {
      // Extract solution
      const solution: Solution = { variables: {}, optimalValue: 0 };

      for (let j = 0; j < numVariables; j++) {
        const varName = `x${j + 1}`;
        // Check if this variable is basic
        const basicIdx = basicVariables.indexOf(varName);
        if (basicIdx !== -1) {
          solution.variables[varName] = round(tableau[basicIdx][totalVars]);
        } else {
          solution.variables[varName] = 0;
        }
      }

      let optVal = round(tableau[objRowIdx][totalVars]);
      if (objectiveType === "max") {
        optVal = -optVal;
      }
      solution.optimalValue = optVal;

      steps.push({
        table: deepCopy(tableau),
        headers: [...headers],
        basicVariables: [...basicVariables],
        pivotRow: null,
        pivotCol: null,
        explanation: `✅ Optimal solution found! All RHS values are non-negative. Z = ${solution.optimalValue}`,
      });

      return { standardForm: standardFormLines, steps, solution, error: null };
    }

    // Step 2: Find pivot column using minimum ratio test
    // For dual simplex: look at negative entries in pivot row
    // Ratio = |Z-row coefficient / pivot-row coefficient| for negative pivot row entries
    let pivotCol = -1;
    let minRatio = Infinity;

    for (let j = 0; j < totalVars; j++) {
      const pivotRowVal = tableau[pivotRow][j];
      if (pivotRowVal < -1e-10) {
        // Valid candidate (negative entry in pivot row)
        const ratio = Math.abs(tableau[objRowIdx][j] / pivotRowVal);
        if (ratio < minRatio) {
          minRatio = ratio;
          pivotCol = j;
        }
      }
    }

    if (pivotCol === -1) {
      return {
        standardForm: standardFormLines,
        steps,
        solution: null,
        error: "Problem is infeasible — no valid pivot column found.",
      };
    }

    const pivotElement = tableau[pivotRow][pivotCol];

    steps.push({
      table: deepCopy(tableau),
      headers: [...headers],
      basicVariables: [...basicVariables],
      pivotRow,
      pivotCol,
      explanation:
        `Iteration ${iter + 1}: Pivot row = ${basicVariables[pivotRow]} (Row ${pivotRow + 1}) because RHS = ${round(mostNegativeRHS)} is most negative. ` +
        `Pivot column = ${headers[pivotCol]} using minimum ratio test (ratio = ${round(minRatio)}). ` +
        `Pivot element = ${round(pivotElement)}.`,
    });

    // Step 3: Perform pivot operation
    // Normalize pivot row
    for (let j = 0; j <= totalVars; j++) {
      tableau[pivotRow][j] /= pivotElement;
    }

    // Eliminate pivot column from all other rows
    for (let i = 0; i < numRows; i++) {
      if (i === pivotRow) continue;
      const factor = tableau[i][pivotCol];
      for (let j = 0; j <= totalVars; j++) {
        tableau[i][j] -= factor * tableau[pivotRow][j];
      }
    }

    // Update basic variable
    basicVariables[pivotRow] = headers[pivotCol];
  }

  return {
    standardForm: standardFormLines,
    steps,
    solution: null,
    error: "Maximum iterations reached without finding optimal solution.",
  };
}

function deepCopy(arr: number[][]): number[][] {
  return arr.map(row => [...row]);
}

function round(val: number): number {
  return Math.round(val * 10000) / 10000;
}
