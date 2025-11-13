import { cn } from "@/lib/utils";
import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-neutral-950 dark:focus-visible:ring-primary-light",
          {
            "bg-primary text-white shadow-sm hover:bg-primary-dark hover:shadow-md active:scale-[0.98] dark:bg-primary dark:hover:bg-primary-dark":
              variant === "default",
            "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-md active:scale-[0.98] dark:bg-red-600 dark:hover:bg-red-700":
              variant === "destructive",
            "border-2 border-primary bg-white text-primary hover:bg-primary hover:text-white active:scale-[0.98] dark:border-primary-light dark:bg-neutral-950 dark:text-primary-light dark:hover:bg-primary dark:hover:text-white dark:hover:border-primary":
              variant === "outline",
            "bg-accent/10 text-accent-dark hover:bg-accent/20 active:scale-[0.98] dark:bg-accent/20 dark:text-accent-light dark:hover:bg-accent/30":
              variant === "secondary",
            "hover:bg-primary/10 hover:text-primary active:scale-[0.98] dark:hover:bg-primary-light/10 dark:hover:text-primary-light":
              variant === "ghost",
            "text-primary underline-offset-4 hover:underline hover:text-primary-dark dark:text-primary-light dark:hover:text-primary":
              variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3 text-xs": size === "sm",
            "h-12 rounded-lg px-8 text-base font-semibold": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
