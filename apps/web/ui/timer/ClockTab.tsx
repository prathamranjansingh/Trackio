import React from "react";

interface ClockTabProps {
  formattedTime: string;
  formattedDate: string;
}

export const ClockTab: React.FC<ClockTabProps> = ({ formattedTime }) => {
  const formattedDate = new Date()
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .replace(/,/g, "");

  return (
    <div className="flex font-mono flex-col items-center justify-center py-12">
      {/* Current Time Display */}
      <div className="text-7xl md:text-7xl font-mono font-bold text-white mb-6 tracking-wide">
        {formattedTime}
      </div>

      {/* Current Date */}
      <div className="text-xl text-gray-300 mb-8 text-center">
        {formattedDate}
      </div>

      {/* Timezone Info */}
      <div className="text-sm text-gray-400">
        {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </div>
    </div>
  );
};
