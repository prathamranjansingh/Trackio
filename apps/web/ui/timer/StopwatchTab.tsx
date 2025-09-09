import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { formatStopwatchTime } from "@trackio/utils";

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
      <div className="text-6xl md:text-7xl font-mono font-bold text-white mb-12 tracking-wide">
        {formatStopwatchTime(time)}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center mb-8">
        <div
          className={`w-3 h-3 rounded-full mr-3 ${
            isRunning ? "bg-green-500 animate-pulse" : "bg-gray-500"
          }`}
        />
        <span className="text-gray-300 text-sm">
          {isRunning ? "Running" : time > 0 ? "Paused" : "Ready"}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-6">
        <button
          onClick={onToggle}
          className={`flex items-center justify-center w-16 h-16 rounded-full font-semibold text-lg transition-all duration-200 ${
            isRunning
              ? "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/25"
              : "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-600/25"
          } hover:scale-105 active:scale-95`}
        >
          {isRunning ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 shadow-lg hover:shadow-gray-600/25 hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-8 text-xs text-gray-400 text-center">
        <div className="flex gap-4 justify-center">
          <div>
            <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300">
              Space
            </kbd>{" "}
            Start/Pause
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300">R</kbd>{" "}
            Reset
          </div>
        </div>
      </div>
    </div>
  );
};
