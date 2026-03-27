import type { IterationStep } from "@/lib/dualSimplex";

interface TableViewProps {
  step: IterationStep;
  stepIndex: number;
  isLast: boolean;
}

function formatNum(val: number): string {
  const rounded = Math.round(val * 10000) / 10000;
  if (rounded === 0) return "0";
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export default function TableView({ step, stepIndex, isLast }: TableViewProps) {
  const { table, headers, basicVariables, pivotRow, pivotCol, explanation } = step;
  const objRowIdx = table.length - 1;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/50">
        <h3 className="font-semibold text-sm text-foreground">
          {stepIndex === 0 ? "Initial Tableau" : isLast ? "Final Result" : `Iteration ${stepIndex}`}
        </h3>
      </div>

      {/* Explanation */}
      <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border bg-muted/30">
        {explanation}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">Basic</th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-3 py-2 text-center font-medium ${
                    i === pivotCol ? "bg-pivot-col text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, ri) => {
              const isObjRow = ri === objRowIdx;
              const isPivotRow = ri === pivotRow;

              return (
                <tr
                  key={ri}
                  className={`border-b border-border last:border-0 ${
                    isPivotRow ? "bg-pivot-row" : isObjRow ? "bg-secondary/30" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {isObjRow ? "Z" : basicVariables[ri] || "-"}
                  </td>
                  {row.map((val, ci) => {
                    const isPivotElement = ri === pivotRow && ci === pivotCol;
                    return (
                      <td
                        key={ci}
                        className={`px-3 py-2 text-center ${
                          isPivotElement
                            ? "bg-pivot-element font-bold text-foreground"
                            : ci === pivotCol
                            ? "bg-pivot-col"
                            : ""
                        }`}
                      >
                        {formatNum(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
