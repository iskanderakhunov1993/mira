"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used inside <Tabs>");
  }
  return context;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const currentValue = value ?? internalValue;

  const handleValueChange = React.useCallback((nextValue: string) => {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }, [onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("inline-flex items-center rounded-2xl bg-white p-1 shadow-[0_8px_24px_rgba(26,26,26,0.06)]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: currentValue, onValueChange } = useTabs();
  const isActive = currentValue === value;

  return (
    <button
      type="button"
      className={cn(
        "rounded-xl px-3 py-2 text-xs font-bold text-[#8E8E93] transition sm:px-4",
        isActive && "bg-[#E872A0] text-white shadow-[0_8px_18px_rgba(232,114,160,0.25)]",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: currentValue } = useTabs();
  if (currentValue !== value) return null;

  return (
    <div className={cn("mt-6", className)} {...props}>
      {children}
    </div>
  );
}
