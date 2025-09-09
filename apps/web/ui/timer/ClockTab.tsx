import React from "react";

interface ClockTabProps {
  formattedTime: string;
  formattedDate: string;
}

export const ClockTab: React.FC<ClockTabProps> = ({
  formattedTime,
  formattedDate,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Current Time Display */}
      <div className="text-6xl md:text-7xl font-mono font-bold text-white mb-6 tracking-wide">
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
