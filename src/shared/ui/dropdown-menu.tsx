// components/ui/dropdown-menu.tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuSeparatorProps {
  className?: string
}

const DropdownContext = React.createContext<{
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({ isOpen: false, setIsOpen: () => {} })

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownContext)

  return (
    <div onClick={() => setIsOpen(!isOpen)}>
      {children}
    </div>
  )
}

export function DropdownMenuContent({ children, className }: DropdownMenuContentProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownContext)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [setIsOpen])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
        className
      )}
    >
      <div className="py-1">{children}</div>
    </div>
  )
}

export function DropdownMenuItem({ children, className, onClick }: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownContext)

  const handleClick = () => {
    if (onClick) onClick()
    setIsOpen(false)
  }

  return (
    <div
      className={cn(
        "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        "block px-4 py-2 text-sm text-gray-500 font-medium",
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <hr
      className={cn(
        "my-1 h-px bg-gray-200",
        className
      )}
    />
  )
}