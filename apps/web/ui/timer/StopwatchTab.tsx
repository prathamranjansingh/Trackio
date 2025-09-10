import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { formatTimeWithHours } from "@trackio/utils";

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
    <div className="flex flex-col items-center justify-center py-12">
      {/* Timer Display */}
      <div className="text-7xl font-mono font-bold text-white mb-12 tracking-wide">
        <span>{formatTimeWithHours(time)}</span>
      </div>

      {/* Controls */}
      <div className="flex gap-6">
        <button
          onClick={onToggle}
          className="flex text-white bg-[#151515] items-center justify-center w-16 h-16 rounded-full transition-all duration-200"
          aria-label={isRunning ? "Pause stopwatch" : "Start stopwatch"}
        >
          {isRunning ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-[#151515] text-white transition-all duration-200"
          aria-label="Reset stopwatch"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
