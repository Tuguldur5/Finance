"use client";

import * as React from "react";

import { TransactionDialog } from "./transaction-dialog";

type QuickAddContextValue = {
  openQuickAdd: () => void;
};

const QuickAddContext = React.createContext<QuickAddContextValue | null>(null);

export function useQuickAdd(): QuickAddContextValue {
  const context = React.useContext(QuickAddContext);

  if (!context) {
    throw new Error("useQuickAdd must be used within a QuickAddProvider");
  }

  return context;
}

/**
 * One quick-add entry point shared by the header button and the mobile FAB.
 * The dialog itself becomes a bottom Drawer on mobile.
 */
export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const value = React.useMemo<QuickAddContextValue>(
    () => ({ openQuickAdd: () => setOpen(true) }),
    [],
  );

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <TransactionDialog open={open} onOpenChange={setOpen} />
    </QuickAddContext.Provider>
  );
}
