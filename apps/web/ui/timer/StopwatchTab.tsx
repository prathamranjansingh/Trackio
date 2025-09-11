import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { formatTimeWithHours } from "@trackio/utils";
import { TabContainer } from "./TabContainer";

interface StopwatchTabProps {
  time: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export const StopwatchTab: React.FC<StopwatchTabProps> = ({
  time,
  isRunning,
  onToggle,
  onReset,
}) => {
  return (
    <TabContainer>
      {/* Timer Display */}
      <div className="text-7xl md:text-5xl font-mono font-bold text-white mb-12 tracking-wide">
        {formatTimeWithHours(time)}
      </div>

      {/* Controls */}
      <div className="flex gap-6">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-16 h-16 md:w-12 md:h-12 rounded-full bg-[#151515] text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label={isRunning ? "Pause stopwatch" : "Start stopwatch"}
        >
          {isRunning ? (
            <Pause className="w-6 h-6 md:w-5 md:h-5" />
          ) : (
            <Play className="w-6 h-6 md:w-5 md:h-5" />
          )}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center w-16 h-16 md:w-12 md:h-12 rounded-full bg-[#151515] text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Reset stopwatch"
        >
          <RotateCcw className="w-6 h-6 md:w-5 md:h-5" />
        </button>
      </div>
    </TabContainer>
  );
};
