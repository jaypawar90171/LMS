export const Button = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105 active:scale-95";

  const variants = {
    default:
      "bg-black text-white bg-black hover:bg-amber-700 shadow-lg hover:shadow-xl",
    outline:
      "border-2 border-amber-600 bg-white text-amber-600 hover:bg-amber-600 hover:text-white",
    ghost: "hover:bg-yellow-100 text-gray-700 hover:text-amber-600",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg",
    secondary: "bg-amber-600 text-white hover:bg-amber-600 shadow-md",
  };

  const sizes = {
    default: "h-11 px-6 py-2 text-sm",
    sm: "h-9 px-4 text-xs",
    lg: "h-12 px-8 text-base",
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
