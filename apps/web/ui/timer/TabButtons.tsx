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
      className={`text-base bg-transparent font-mono flex-1 border-2 font-bold border-subtle hover:bg-[#FE4C20] transition-all duration-200 ${
        active ? "text-black border-2 bg-[#FE4C20]" : ""
      }`}
      variant="default"
      size="default"
    >
      {children}
    </Button>
  );
};
