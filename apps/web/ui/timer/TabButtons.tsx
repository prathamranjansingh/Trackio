import { Button } from "@trackio/ui";
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
      className={`text-base bg-[#FF7734] font-mono flex-1 border-2 font-bold border-subtle hover:bg-[#e64c00] transition-all duration-200 ${
        active ? "text-black border-[1px] bg-[#e64c00]" : ""
      }`}
      variant="default"
      size="default"
    >
      {children}
    </Button>
  );
};
