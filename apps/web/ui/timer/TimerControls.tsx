import React from "react";
import { Play, Pause, Flag, RotateCcw } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  onStartStop: () => void;
  onLap: () => void;
  onReset: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStartStop,
  onLap,
  onReset,
}) => {
  return (
    <div className="flex justify-center gap-4 mb-6">
      <button
        onClick={onStartStop}
        className={`flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
          isRunning
            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
            : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
        } hover:scale-105 active:scale-95`}
      >
        {isRunning ? (
          <Pause className="w-6 h-6 mr-2" />
        ) : (
          <Play className="w-6 h-6 mr-2" />
        )}
        {isRunning ? "Pause" : "Start"}
      </button>

      <button
        onClick={onLap}
        disabled={!isRunning}
        className="flex items-center px-8 py-4 rounded-xl font-semibold text-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:text-slate-400 text-white transition-all duration-200 shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:shadow-none"
      >
        <Flag className="w-6 h-6 mr-2" />
        Lap
      </button>

      <button
        onClick={onReset}
        className="flex items-center px-8 py-4 rounded-xl font-semibold text-lg bg-slate-600 hover:bg-slate-700 text-white transition-all duration-200 shadow-lg shadow-slate-600/25 hover:scale-105 active:scale-95"
      >
        <RotateCcw className="w-6 h-6 mr-2" />
        Reset
      </button>
    </div>
  );
};
