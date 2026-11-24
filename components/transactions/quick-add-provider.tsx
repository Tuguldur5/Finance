"use client";

import * as React from "react";

import { TransactionDialog } from "./transaction-dialog";
import { clearTransactionDraft } from "./transaction-form";

type QuickAddContextValue = {
  openQuickAdd: () => void;
  isOpen: boolean;
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

  // Leaving the dashboard layout (sign-out, navigation to the public site)
  // must not leave one user's draft visible to the next session.
  React.useEffect(() => () => clearTransactionDraft(), []);

  const value = React.useMemo<QuickAddContextValue>(
    () => ({ openQuickAdd: () => setOpen(true), isOpen: open }),
    [open],
  );

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <TransactionDialog open={open} onOpenChange={setOpen} />
    </QuickAddContext.Provider>
  );
}
