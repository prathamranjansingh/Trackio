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
    <div className="bg-[#1e1e1e] border-subtle rounded-[40px] flex items-center justify-center p-4">
      <div className="w-full mx-auto">
        {/* Tab Content */}
        <div className="p-4 md:p-6">
          {activeTab === "stopwatch" ? (
            <StopwatchTab
              time={time}
              isRunning={isRunning}
              onToggle={toggle}
              onReset={reset}
            />
          ) : (
            <ClockTab formattedTime={formattedTime} />
          )}
        </div>
        <div className="flex flex-col gap-2">
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
      </div>
    </div>
  );
};

export default ProductionStopwatch;
