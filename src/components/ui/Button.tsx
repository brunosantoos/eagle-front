import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/src/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "gold" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl shadow-md text-sm font-medium ring-offset-eagle-black transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eagle-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-eagle-red text-white hover:bg-eagle-red/90": variant === "default",
            "bg-eagle-gold text-eagle-black hover:bg-eagle-gold/90": variant === "gold",
            "border border-eagle-red text-eagle-red hover:bg-eagle-red/10": variant === "outline",
            "hover:bg-eagle-gray hover:text-eagle-light": variant === "ghost",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-xl px-3": size === "sm",
            "h-12 rounded-2xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
