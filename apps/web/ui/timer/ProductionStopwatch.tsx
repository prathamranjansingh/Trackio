"use client";
import React, { useState } from "react";
import { Clock, Timer } from "lucide-react";
import { useStopwatch } from "@trackio/utils";
import { useCurrentTime } from "@trackio/utils";
import { TabButton } from "../timer/TabButtons";
import { StopwatchTab } from "../timer/StopwatchTab";
import { ClockTab } from "../timer/ClockTab";

type TabType = "stopwatch" | "clock";

const ProductionStopwatch: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("stopwatch");
  const { time, isRunning, toggle, reset } = useStopwatch();
  const { formattedTime, formattedDate } = useCurrentTime();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
          <div className="flex border-b border-gray-700">
            <TabButton
              active={activeTab === "stopwatch"}
              onClick={() => setActiveTab("stopwatch")}
            >
              <div className="flex items-center justify-center gap-2">
                <Timer className="w-4 h-4" />
                Stopwatch
              </div>
            </TabButton>
            <TabButton
              active={activeTab === "clock"}
              onClick={() => setActiveTab("clock")}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Local Time
              </div>
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "stopwatch" ? (
              <StopwatchTab
                time={time}
                isRunning={isRunning}
                onToggle={toggle}
                onReset={reset}
              />
            ) : (
              <ClockTab
                formattedTime={formattedTime}
                formattedDate={formattedDate}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-6">
            <div className="text-center text-xs text-gray-500">
              {activeTab === "stopwatch"
                ? "Perfect for coding sessions and study tracking"
                : "Your current local time and date"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionStopwatch;
