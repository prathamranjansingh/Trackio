import { ReactNode } from "react";

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function CardWrapper({ children, className }: CardWrapperProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
