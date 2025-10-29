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
    <div className=" flex items-center justify-center p-4">
      <div className="w-full mx-auto">
        {/* Tab Content */}
        <div className="p-4 md:p-6 min-h-[220px] flex flex-col items-center justify-center transition-all duration-300">
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
              Stopwatch
            </div>
          </TabButton>
          <TabButton
            active={activeTab === "clock"}
            onClick={() => setActiveTab("clock")}
          >
            <div className="flex items-center justify-center gap-2">
              Localtime
            </div>
          </TabButton>
        </div>
      </div>
    </div>
  );
};

export default ProductionStopwatch;
