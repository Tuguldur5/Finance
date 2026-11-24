import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

function PaginationPrevious({
  className,
  label,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={label}
      className={cn("gap-1 px-2 text-xs", className)}
      {...props}
    >
      <ChevronLeft className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

function PaginationNext({
  className,
  label,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={label}
      className={cn("gap-1 px-2 text-xs", className)}
      {...props}
    >
      <span className="hidden sm:inline">{label}</span>
      <ChevronRight className="size-3.5" />
    </Button>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
}
