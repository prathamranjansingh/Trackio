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
      <div className="font-obviously text-9xl md:text-8xl font-extrabold text-black mb-6 tracking-wide">
        {formattedTime}
      </div>

      {/* Date */}
      <div className="text-xl font-mono font-medium text-black mb-8 text-center">
        {formattedDate}
      </div>

      {/* Timezone */}
      <div className="text-sm text-black">
        {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </div>
    </TabContainer>
  );
};
