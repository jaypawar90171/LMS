import React from "react";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  color?: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean; // Add the disabled prop here
}

const Button: React.FC<ButtonProps> = ({
  type = "button",
  onClick,
  children,
  color,
  disabled = false, // Give the disabled prop a default value of false
}) => {
  const defaultClasses =
    "w-full py-3 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2";

  const colorMap: { [key: string]: string } = {
    blue: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    red: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    green: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    default: "bg-black text-white hover:bg-gray-900 focus:ring-gray-700",
  };

  const colorClasses =
    colorMap[color as keyof typeof colorMap] || colorMap.default;

  const disabledClasses = "opacity-50 cursor-not-allowed";

  // Conditionally apply disabled styles
  const finalClasses = `${defaultClasses} ${colorClasses} ${
    disabled ? disabledClasses : ""
  }`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={finalClasses}
      disabled={disabled} // Apply the disabled attribute
    >
      {children}
    </button>
  );
};

export default Button;