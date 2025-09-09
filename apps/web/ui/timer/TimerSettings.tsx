import React from "react";
import { Volume2, VolumeX } from "lucide-react";

interface TimerSettingsProps {
  precision: number;
  soundEnabled: boolean;
  onPrecisionChange: (precision: number) => void;
  onSoundToggle: () => void;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  precision,
  soundEnabled,
  onPrecisionChange,
  onSoundToggle,
}) => {
  return (
    <>
      <div className="flex justify-center gap-6 text-sm mb-6">
        <div className="flex items-center gap-2">
          <label className="text-slate-300">Precision:</label>
          <select
            value={precision}
            onChange={(e) => onPrecisionChange(Number(e.target.value))}
            className="bg-slate-700 text-white px-2 py-1 rounded border border-slate-600"
          >
            <option value={1}>0.0s</option>
            <option value={2}>0.00s</option>
            <option value={3}>0.000s</option>
          </select>
        </div>

        <button
          onClick={onSoundToggle}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          Sound
        </button>
      </div>

      <div className="text-xs text-slate-400 text-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Space</kbd>{" "}
            Start/Stop
          </div>
          <div>
            <kbd className="px-2 py-1 bg-slate-800 rounded">L</kbd> Lap
          </div>
          <div>
            <kbd className="px-2 py-1 bg-slate-800 rounded">Ctrl+R</kbd> Reset
          </div>
        </div>
      </div>
    </>
  );
};
