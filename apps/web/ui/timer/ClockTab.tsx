import React from "react";
import { TabContainer } from "./TabContainer";

interface ClockTabProps {
  formattedTime: string;
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
    <TabContainer>
      {/* Current Time */}
      <div className="text-7xl md:text-5xl font-mono font-bold text-white mb-6 tracking-wide">
        {formattedTime}
      </div>

      {/* Date */}
      <div className="text-xl text-gray-300 mb-8 text-center">
        {formattedDate}
      </div>

      {/* Timezone */}
      <div className="text-sm text-gray-400">
        {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </div>
    </TabContainer>
  );
};
