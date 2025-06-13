// src/components/ui/sidebar.tsx
import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType>({
  isOpen: true,
  setIsOpen: () => {}
})

export function SidebarProvider({
  children,
  defaultOpen = true
}: {
  children: React.ReactNode;
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { isOpen } = React.useContext(SidebarContext)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col bg-white transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        className
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        "flex h-16 items-center border-b border-gray-100 px-4",
        className
      )}
    >
      {children}
    </header>
  )
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto py-2">{children}</div>
}

export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <footer
      className={cn(
        "border-t border-gray-100 py-2",
        className
      )}
    >
      {children}
    </footer>
  )
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1 px-2">{children}</ul>
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>
}

export function SidebarMenuButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { isOpen, setIsOpen } = React.useContext(SidebarContext)

  return (
    <button
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 shadow-md hover:bg-gray-50 md:hidden",
        className
      )}
      onClick={() => setIsOpen(!isOpen)}
      aria-label="Toggle Sidebar"
    >
      {isOpen ? "×" : "☰"}
    </button>
  )
}

export function SidebarSeparator({ className }: { className?: string }) {
  return (
    <hr
      className={cn(
        "my-2 border-gray-100",
        className
      )}
    />
  )
}