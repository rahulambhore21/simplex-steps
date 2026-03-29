import { useState } from "react";
import InputForm from "@/components/InputForm";
import TableView from "@/components/TableView";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import { solveDualSimplex, type ProblemInput, type SolverResult } from "@/lib/dualSimplex";

export default function Index() {
  const [result, setResult] = useState<SolverResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [input, setInput] = useState<ProblemInput | null>(null);

  const handleSolve = (problemInput: ProblemInput) => {
    const res = solveDualSimplex(problemInput);
    setResult(res);
    setInput(problemInput);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Dual Simplex Solver
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step-by-step Linear Programming solver using the Dual Simplex Method
          </p>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Input */}
        <InputForm onSolve={handleSolve} />

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Standard Form */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Standard Form</h2>
              <div className="space-y-1 font-mono text-sm text-muted-foreground">
                {result.standardForm.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>

            {/* Error */}
            {result.error && (
              <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-4 text-sm font-medium">
                {result.error}
              </div>
            )}

            {/* Step Navigation */}
            {result.steps.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
                >
                  ← Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {result.steps.length}
                </span>
                <button
                  onClick={() => setCurrentStep(s => Math.min(result.steps.length - 1, s + 1))}
                  disabled={currentStep === result.steps.length - 1}
                  className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
                >
                  Next →
                </button>
                <button
                  onClick={() => setCurrentStep(result.steps.length - 1)}
                  className="ml-auto px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Show All
                </button>
              </div>
            )}

            {/* Show current step or all steps */}
            {currentStep === result.steps.length - 1 ? (
              <div className="space-y-4">
                {result.steps.map((step, i) => (
                  <TableView
                    key={i}
                    step={step}
                    stepIndex={i}
                    isLast={i === result.steps.length - 1}
                  />
                ))}
              </div>
            ) : (
              <TableView
                step={result.steps[currentStep]}
                stepIndex={currentStep}
                isLast={false}
              />
            )}

            {/* Analytics Panel */}
            {result.steps.length > 0 && input && (
              <AnalyticsPanel
                result={result}
                problem={input}
                headers={result.steps[0]?.headers || []}
              />
            )}

            {/* Final Solution */}
            {result.solution && (
              <div className="bg-card rounded-lg border-2 border-accent p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Optimal Solution</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {Object.entries(result.solution.variables).map(([name, val]) => (
                    <div key={name} className="bg-accent/10 rounded-md px-4 py-3 text-center">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {name}
                      </div>
                      <div className="text-lg font-bold font-mono text-foreground mt-1">{val}</div>
                    </div>
                  ))}
                  <div className="bg-primary/10 rounded-md px-4 py-3 text-center">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Z (Optimal)
                    </div>
                    <div className="text-lg font-bold font-mono text-primary mt-1">
                      {result.solution.optimalValue}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
