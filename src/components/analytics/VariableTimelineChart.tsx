import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { SolverResult } from "@/lib/dualSimplex";
import { extractVariableProgression, formatNumber } from "@/lib/analyticsExtractor";

interface VariableTimelineChartProps {
  result: SolverResult;
  numVariables: number;
}

const COLORS = [
  "#2563eb", // blue
  "#059669", // green
  "#d97706", // amber
  "#7c3aed", // purple
  "#e11d48", // red
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#14b8a6", // teal
];

export default function VariableTimelineChart({
  result,
  numVariables,
}: VariableTimelineChartProps) {
  const data = extractVariableProgression(result, numVariables);

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        No data available
      </div>
    );
  }

  // Find max value for proper scaling
  let maxVal = 0;
  data.forEach((item) => {
    for (let i = 1; i <= numVariables; i++) {
      const val = (item[`x${i}`] as number) || 0;
      maxVal = Math.max(maxVal, val);
    }
  });

  const padding = maxVal * 0.1 || 1;

  return (
    <div className="w-full h-80 bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Decision Variables Over Iterations
      </h3>
      <ChartContainer config={{}} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="iteration"
              label={{ value: "Iteration", position: "insideBottom", offset: -5 }}
              stroke="#6b7280"
            />
            <YAxis
              label={{ value: "Value", angle: -90, position: "insideLeft" }}
              stroke="#6b7280"
              domain={[0, maxVal + padding]}
            />
            <ChartTooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#09f", strokeWidth: 2 }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            {Array.from({ length: numVariables }).map((_, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={`x${i + 1}`}
                stroke={COLORS[i % COLORS.length]}
                dot={{ fill: COLORS[i % COLORS.length], r: 3 }}
                activeDot={{ r: 5 }}
                name={`x${i + 1}`}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <p className="text-xs text-muted-foreground mt-2">
        Final Values:
        {Array.from({ length: numVariables }).map((_, i) => (
          <span key={i} className="ml-3">
            <span style={{ color: COLORS[i % COLORS.length] }}>●</span> x{i + 1} ={" "}
            {formatNumber((data[data.length - 1][`x${i + 1}`] as number) || 0)}
          </span>
        ))}
      </p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-md">
        {payload.map((entry, idx) => (
          <p key={idx} className="text-xs font-mono">
            <span style={{ color: entry.color }}>{entry.dataKey}</span> ={" "}
            {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}
