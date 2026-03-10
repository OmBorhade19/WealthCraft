import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === "number") {
      // Prevent entering negative signs, scientific notation 'e', and other non-numeric symbols when expected pure positive numbers
      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
        e.preventDefault()
      }
    }
    props.onKeyDown?.(e)
  }

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (type === "number") {
      // Blur the input specifically to stop the mouse scroll wheel from inadvertently tumbling the numerical value
      ; (e.target as HTMLElement).blur()
    }
    props.onWheel?.(e)
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      min={type === "number" ? "0" : props.min}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      {...props}
    />
  )
}

export { Input }
