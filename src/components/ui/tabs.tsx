// components/ui/tabs.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  children: React.ReactNode
  value: string
  onValueChange: (value: string) => void
  className?: string
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ children, className }: TabsProps) {
  return <div className={cn("w-full", className)}>{children}</div>
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ children, className, ...props }: TabsTriggerProps) {
  const isActive = props['aria-selected']

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}