"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "className"
> & {
  className?: string;
  invalid?: boolean;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, invalid = false, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-auth-muted"
        />
        <Input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          variant="lavender"
          aria-invalid={invalid}
          className={cn("h-10 pl-9 pr-11 text-xs", className)}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-auth-muted outline-none hover:bg-black/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-auth-focus/60"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
    );
  },
);

export { PasswordInput };
