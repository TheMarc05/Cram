import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  fullScreen = false,
  className,
}) => {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div
            className={`animate-spin rounded-full border-4 border-blue-600 border-t-transparent ${
              sizeClasses[size]
            } mx-auto ${className || ""}`}
          />
          {text && (
            <p className="text-gray-600 mt-3 text-base">
              {text || "Loading..."}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-blue-600 border-t-transparent ${sizeClasses[size]} ${className}`}
    >
      {text || "Loading..."}
    </div>
  );
};
