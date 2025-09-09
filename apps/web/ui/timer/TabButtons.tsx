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
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-6 text-sm font-medium transition-all duration-200 ${
        active
          ? "text-white bg-gray-700 border-b-2 border-blue-500"
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
};
