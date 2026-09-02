import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface InfoPopoverState {
  key: string;
  rect: DOMRect;
}

export interface DashboardContextValue {
  infoPopover: InfoPopoverState | null;
  openInfoPopover: (key: string, rect: DOMRect) => void;
  closeInfoPopover: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [infoPopover, setInfoPopover] = useState<InfoPopoverState | null>(null);

  const openInfoPopover = (key: string, rect: DOMRect) => {
    setInfoPopover({ key, rect });
  };

  const closeInfoPopover = () => {
    setInfoPopover(null);
  };

  return (
    <DashboardContext.Provider value={{ infoPopover, openInfoPopover, closeInfoPopover }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return ctx;
};
