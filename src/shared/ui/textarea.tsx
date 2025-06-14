import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Accessible label for the textarea
   */
  "aria-label"?: string;

  /**
   * Whether the textarea is required
   */
  "aria-required"?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, "aria-label": ariaLabel, "aria-required": ariaRequired, required, ...props },
    ref
  ) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        aria-label={ariaLabel || props.placeholder || "Text input"}
        aria-required={ariaRequired || required || false}
        required={required}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
