import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmationContextType {
  confirmation: ConfirmationConfig | null;
  requestConfirmation: (config: ConfirmationConfig) => void;
  closeConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmation, setConfirmation] = useState<ConfirmationConfig | null>(null);

  const requestConfirmation = useCallback((config: ConfirmationConfig) => {
    setConfirmation(config);
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirmation, requestConfirmation, closeConfirmation }}>
      {children}
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

