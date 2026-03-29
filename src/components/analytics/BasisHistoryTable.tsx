import type { SolverResult } from "@/lib/dualSimplex";
import { extractBasisHistory, formatNumber } from "@/lib/analyticsExtractor";
import { cn } from "@/lib/utils";

interface BasisHistoryTableProps {
  result: SolverResult;
  headers: string[];
}

export default function BasisHistoryTable({
  result,
  headers,
}: BasisHistoryTableProps) {
  const history = extractBasisHistory(result);

  if (history.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/50">
        <h3 className="text-sm font-semibold text-foreground">Basis History</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              <th className="px-4 py-2 text-left font-semibold text-foreground">
                Iter
              </th>
              <th className="px-4 py-2 text-left font-semibold text-foreground">
                Entering
              </th>
              <th className="px-4 py-2 text-left font-semibold text-foreground">
                Leaving
              </th>
              <th className="px-4 py-2 text-left font-semibold text-foreground">
                Basic Variables
              </th>
              <th className="px-4 py-2 text-right font-semibold text-foreground">
                RHS Values
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => (
              <tr
                key={idx}
                className={cn(
                  "border-b border-border last:border-0",
                  idx % 2 === 1 ? "bg-muted/20" : ""
                )}
              >
                <td className="px-4 py-2 text-center font-mono text-foreground">
                  {entry.iteration}
                </td>
                <td
                  className={cn(
                    "px-4 py-2 font-mono",
                    entry.enteringVariable
                      ? "text-accent font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {entry.enteringVariable || "—"}
                </td>
                <td
                  className={cn(
                    "px-4 py-2 font-mono",
                    entry.leavingVariable
                      ? "text-destructive font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {entry.leavingVariable || "—"}
                </td>
                <td className="px-4 py-2 font-mono text-foreground">
                  {entry.basisVariables.join(", ")}
                </td>
                <td className="px-4 py-2 font-mono text-right text-muted-foreground">
                  <div className="flex gap-1 justify-end text-xs">
                    {entry.rhsValues?.map((val, vidx) => (
                      <span key={vidx} title={`${headers[vidx]}: ${val}`}>
                        {formatNumber(val)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground">
        <p>
          Green = Entering variable (joins basis) | Red = Leaving variable (leaves basis)
        </p>
      </div>
    </div>
  );
}
