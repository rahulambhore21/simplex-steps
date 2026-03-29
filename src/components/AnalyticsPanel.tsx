import { useState } from "react";
import type { SolverResult, ProblemInput } from "@/lib/dualSimplex";
import ZProgressionChart from "./analytics/ZProgressionChart";
import VariableTimelineChart from "./analytics/VariableTimelineChart";
import BasisHistoryTable from "./analytics/BasisHistoryTable";
import FeasibleRegionPlot from "./analytics/FeasibleRegionPlot";
import { cn } from "@/lib/utils";

interface AnalyticsPanelProps {
  result: SolverResult;
  problem: ProblemInput;
  headers: string[];
}

type TabType = "convergence" | "variables" | "feasible" | "basis";

export default function AnalyticsPanel({
  result,
  problem,
  headers,
}: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("convergence");

  const tabs: Array<{
    id: TabType;
    label: string;
    description: string;
    enabled: boolean;
  }> = [
    {
      id: "convergence",
      label: "Convergence",
      description: "Objective function improvement",
      enabled: true,
    },
    {
      id: "variables",
      label: "Variables",
      description: "Decision variable progression",
      enabled: true,
    },
    {
      id: "feasible",
      label: "Feasible Region",
      description: "Constraint boundaries (2-var only)",
      enabled: problem.numVariables === 2,
    },
    {
      id: "basis",
      label: "Basis History",
      description: "Variable entering/leaving basis",
      enabled: true,
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-border bg-secondary/20 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={!tab.enabled}
            title={tab.description}
            className={cn(
              "flex-shrink-0 px-4 py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === tab.id && tab.enabled
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground",
              !tab.enabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {tab.label}
            {!tab.enabled && <span className="ml-1 text-xs">(N/A)</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "convergence" && (
          <ZProgressionChart result={result} />
        )}
        {activeTab === "variables" && (
          <VariableTimelineChart result={result} numVariables={problem.numVariables} />
        )}
        {activeTab === "feasible" && problem.numVariables === 2 && (
          <FeasibleRegionPlot input={problem} result={result} />
        )}
        {activeTab === "basis" && (
          <BasisHistoryTable result={result} headers={headers} />
        )}
      </div>
    </div>
  );
}
