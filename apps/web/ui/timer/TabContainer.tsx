import React from "react";

interface TabContainerProps {
  children: React.ReactNode;
}

export const TabContainer: React.FC<TabContainerProps> = ({ children }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-2">
      {children}
    </div>
  );
};
