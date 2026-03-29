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
import { extractZProgression, formatNumber } from "@/lib/analyticsExtractor";

interface ZProgressionChartProps {
  result: SolverResult;
}

export default function ZProgressionChart({ result }: ZProgressionChartProps) {
  const data = extractZProgression(result);

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        No data available
      </div>
    );
  }

  const minZ = Math.min(...data.map((d) => d.zValue));
  const maxZ = Math.max(...data.map((d) => d.zValue));
  const padding = Math.abs(maxZ - minZ) * 0.1 || 1;

  return (
    <div className="w-full h-80 bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Objective Function (Z) Progression
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
              label={{ value: "Z Value", angle: -90, position: "insideLeft" }}
              stroke="#6b7280"
              domain={[minZ - padding, maxZ + padding]}
            />
            <ChartTooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#09f", strokeWidth: 2 }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            <Line
              type="monotone"
              dataKey="zValue"
              stroke="#2563eb"
              dot={{ fill: "#2563eb", r: 4 }}
              activeDot={{ r: 6 }}
              name="Z Value"
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <p className="text-xs text-muted-foreground mt-2">
        Optimal Value: <span className="font-semibold">{formatNumber(data[data.length - 1].zValue)}</span>
      </p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { explanation: string; iteration: number } }>;
}) {
  if (active && payload && payload.length) {
    const { zValue, explanation, iteration } = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-md max-w-xs">
        <p className="text-xs font-semibold text-foreground">Iteration {iteration}</p>
        <p className="text-sm font-mono text-accent">Z = {formatNumber(zValue)}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{explanation}</p>
      </div>
    );
  }
  return null;
}
