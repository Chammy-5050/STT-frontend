"use client";

import * as React from "react";
import {
  Controller,
  FormProvider,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const Form = FormProvider;

function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

function FormItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return <Label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

function FormControl({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function FormDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs leading-5 text-auth-muted", className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      role="alert"
      className={cn("text-xs leading-5 font-medium text-destructive", className)}
      {...props}
    />
  );
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
};
