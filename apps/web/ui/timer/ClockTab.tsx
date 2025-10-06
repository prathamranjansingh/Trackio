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
      <div className="text-5xl md:text-5xl font-mono font-extrabold text-[#D7662D] mb-6 tracking-wide">
        {formattedTime}
      </div>

      {/* Date */}
      <div className="text-xl font-medium text-[#747678] mb-8 text-center">
        {formattedDate}
      </div>

      {/* Timezone */}
      <div className="text-sm text-[#747678]">
        {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </div>
    </TabContainer>
  );
};
