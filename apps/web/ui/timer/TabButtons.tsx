import { Button } from "@repo/ui";
import React from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  children,
}) => {
  return (
    <Button
      onClick={onClick}
      className={`text-base bg-[#151515] font-mono flex-1 border-2 border-subtle mx-2 hover:bg-[#151515] transition-all duration-200 ${
        active ? "text-white border-[1px]" : "text-[#929292] "
      }`}
    >
      {children}
    </Button>
  );
};
