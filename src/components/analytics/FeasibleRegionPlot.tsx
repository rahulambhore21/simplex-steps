import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { SolverResult, ProblemInput } from "@/lib/dualSimplex";
import {
  extractConstraintPlotData,
  extractIterationPoints,
  formatNumber,
} from "@/lib/analyticsExtractor";

interface FeasibleRegionPlotProps {
  input: ProblemInput;
  result: SolverResult;
}

const CONSTRAINT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
];

export default function FeasibleRegionPlot({
  input,
  result,
}: FeasibleRegionPlotProps) {
  // Only works for 2 variables
  if (input.numVariables !== 2) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Feasible region plot only available for 2-variable problems
      </div>
    );
  }

  const constraintData = extractConstraintPlotData(input, result);
  const iterationPoints = extractIterationPoints(result);

  if (constraintData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        No constraints to plot
      </div>
    );
  }

  // Determine domain bounds
  let maxX1 = 10,
    maxX2 = 10;
  constraintData.forEach((constraint) => {
    constraint.points.forEach((pt) => {
      maxX1 = Math.max(maxX1, pt.x);
      maxX2 = Math.max(maxX2, pt.y);
    });
  });
  if (result.solution) {
    maxX1 = Math.max(maxX1, (result.solution.variables["x1"] || 0) * 1.2 + 1);
    maxX2 = Math.max(maxX2, (result.solution.variables["x2"] || 0) * 1.2 + 1);
  }

  return (
    <div className="w-full h-96 bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Feasible Region & Solution Path
      </h3>
      <ChartContainer config={{}} className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="x"
              label={{ value: "x₁", position: "insideBottomRight", offset: -5 }}
              stroke="#6b7280"
              domain={[0, maxX1]}
            />
            <YAxis
              type="number"
              dataKey="y"
              label={{ value: "x₂", angle: -90, position: "insideLeft" }}
              stroke="#6b7280"
              domain={[0, maxX2]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />

            {/* Constraint lines */}
            {constraintData.map((constraint, idx) => (
              <Line
                key={`constraint-${idx}`}
                type="linear"
                dataKey="y"
                data={constraint.points}
                stroke={CONSTRAINT_COLORS[idx % CONSTRAINT_COLORS.length]}
                strokeWidth={2}
                name={`${constraint.name} (${constraint.type})`}
                dot={false}
                isAnimationActive={false}
              />
            ))}

            {/* Iteration path */}
            <Scatter
              name="Solution Path"
              data={iterationPoints}
              fill="none"
              stroke="#6b7280"
              strokeWidth={2}
              isAnimationActive={false}
            />

            {/* Iteration points */}
            <Scatter
              name="Iteration Steps"
              data={iterationPoints}
              fill="#6b7280"
              fillOpacity={0.6}
              isAnimationActive={false}
            />

            {/* Optimal solution */}
            {result.solution && (
              <Scatter
                name="Optimal Solution"
                data={[{ x1: result.solution.variables["x1"] || 0, x2: result.solution.variables["x2"] || 0, iteration: "Optimal" }]}
                fill="#10b981"
                shape="diamond"
                fillOpacity={1}
                isAnimationActive={false}
              />
            )}

            {/* Origin */}
            <Scatter
              name="Origin"
              data={[{ x: 0, y: 0, iteration: "Start" }]}
              fill="#ef4444"
              shape="cross"
              fillOpacity={0.8}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-3 text-xs text-muted-foreground space-y-1">
        <p>
          <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-2"></span>
          Origin
          {result.solution && (
            <>
              <span className="ml-4">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-2"></span>
                Optimal: x₁ = {formatNumber(result.solution.variables["x1"] || 0)}, x₂ ={" "}
                {formatNumber(result.solution.variables["x2"] || 0)}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: any;
    name: string;
  }>;
}) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-md text-xs">
        {item.payload.iteration !== undefined && (
          <p className="font-semibold">Iteration {item.payload.iteration}</p>
        )}
        <p className="font-mono">
          x₁ = {formatNumber(item.payload.x || item.payload.x1 || 0)}
        </p>
        <p className="font-mono">
          x₂ = {formatNumber(item.payload.y || item.payload.x2 || 0)}
        </p>
      </div>
    );
  }
  return null;
}
