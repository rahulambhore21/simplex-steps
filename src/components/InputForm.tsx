import { useState } from "react";
import type { ProblemInput, ObjectiveType, InequalityType, Constraint } from "@/lib/dualSimplex";

interface InputFormProps {
  onSolve: (input: ProblemInput) => void;
}

const EXAMPLE_PROBLEM: ProblemInput = {
  objectiveType: "min",
  numVariables: 2,
  objectiveCoefficients: [3, 2],
  constraints: [
    { coefficients: [1, 1], inequality: ">=", rhs: 4 },
    { coefficients: [2, 1], inequality: ">=", rhs: 6 },
  ],
};

export default function InputForm({ onSolve }: InputFormProps) {
  const [objectiveType, setObjectiveType] = useState<ObjectiveType>("min");
  const [numVariables, setNumVariables] = useState(2);
  const [objCoeffs, setObjCoeffs] = useState<string[]>(["", ""]);
  const [constraints, setConstraints] = useState<
    { coefficients: string[]; inequality: InequalityType; rhs: string }[]
  >([{ coefficients: ["", ""], inequality: ">=", rhs: "" }]);
  const [error, setError] = useState<string | null>(null);

  const handleNumVarsChange = (val: number) => {
    setNumVariables(val);
    setObjCoeffs(prev => {
      const arr = [...prev];
      while (arr.length < val) arr.push("");
      return arr.slice(0, val);
    });
    setConstraints(prev =>
      prev.map(c => {
        const coeffs = [...c.coefficients];
        while (coeffs.length < val) coeffs.push("");
        return { ...c, coefficients: coeffs.slice(0, val) };
      })
    );
  };

  const addConstraint = () => {
    setConstraints(prev => [
      ...prev,
      { coefficients: new Array(numVariables).fill(""), inequality: ">=", rhs: "" },
    ]);
  };

  const removeConstraint = (idx: number) => {
    if (constraints.length > 1) {
      setConstraints(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const loadExample = () => {
    setObjectiveType(EXAMPLE_PROBLEM.objectiveType);
    setNumVariables(EXAMPLE_PROBLEM.numVariables);
    setObjCoeffs(EXAMPLE_PROBLEM.objectiveCoefficients.map(String));
    setConstraints(
      EXAMPLE_PROBLEM.constraints.map(c => ({
        coefficients: c.coefficients.map(String),
        inequality: c.inequality,
        rhs: String(c.rhs),
      }))
    );
    setError(null);
  };

  const handleSolve = () => {
    setError(null);
    // Validate
    const parsedObjCoeffs = objCoeffs.map(Number);
    if (parsedObjCoeffs.some(isNaN)) {
      setError("Please enter valid objective function coefficients.");
      return;
    }

    const parsedConstraints: Constraint[] = [];
    for (let i = 0; i < constraints.length; i++) {
      const c = constraints[i];
      const coeffs = c.coefficients.map(Number);
      const rhs = Number(c.rhs);
      if (coeffs.some(isNaN) || isNaN(rhs)) {
        setError(`Constraint ${i + 1} has invalid values.`);
        return;
      }
      parsedConstraints.push({ coefficients: coeffs, inequality: c.inequality, rhs });
    }

    onSolve({
      objectiveType,
      numVariables,
      objectiveCoefficients: parsedObjCoeffs,
      constraints: parsedConstraints,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Problem Input</h2>
        <button
          onClick={loadExample}
          className="text-sm px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity font-medium"
        >
          Load Example
        </button>
      </div>

      {/* Objective Type & Num Variables */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Objective</label>
          <select
            value={objectiveType}
            onChange={e => setObjectiveType(e.target.value as ObjectiveType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="min">Minimize</option>
            <option value="max">Maximize</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Variables</label>
          <select
            value={numVariables}
            onChange={e => handleNumVarsChange(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>

      {/* Objective Function */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Objective Function Coefficients
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {objCoeffs.map((val, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground">+</span>}
              <input
                type="number"
                value={val}
                onChange={e => {
                  const arr = [...objCoeffs];
                  arr[i] = e.target.value;
                  setObjCoeffs(arr);
                }}
                placeholder="0"
                className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground font-mono">x{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Constraints</label>
        <div className="space-y-3">
          {constraints.map((c, ci) => (
            <div key={ci} className="flex items-center gap-2 flex-wrap">
              {c.coefficients.map((val, vi) => (
                <div key={vi} className="flex items-center gap-1">
                  {vi > 0 && <span className="text-muted-foreground">+</span>}
                  <input
                    type="number"
                    value={val}
                    onChange={e => {
                      const newC = [...constraints];
                      newC[ci].coefficients[vi] = e.target.value;
                      setConstraints(newC);
                    }}
                    placeholder="0"
                    className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground font-mono">x{vi + 1}</span>
                </div>
              ))}
              <select
                value={c.inequality}
                onChange={e => {
                  const newC = [...constraints];
                  newC[ci].inequality = e.target.value as InequalityType;
                  setConstraints(newC);
                }}
                className="rounded-md border border-input bg-background px-2 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value=">=">≥</option>
                <option value="<=">≤</option>
                <option value="=">=</option>
              </select>
              <input
                type="number"
                value={c.rhs}
                onChange={e => {
                  const newC = [...constraints];
                  newC[ci].rhs = e.target.value;
                  setConstraints(newC);
                }}
                placeholder="0"
                className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {constraints.length > 1 && (
                <button
                  onClick={() => removeConstraint(ci)}
                  className="text-destructive hover:opacity-70 text-sm px-2 py-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addConstraint}
          className="mt-2 text-sm text-primary hover:underline font-medium"
        >
          + Add Constraint
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Solve Button */}
      <button
        onClick={handleSolve}
        className="w-full rounded-md bg-primary text-primary-foreground py-2.5 font-semibold hover:opacity-90 transition-opacity"
      >
        Solve
      </button>
    </div>
  );
}
