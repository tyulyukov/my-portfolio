import { createContext, useCallback, useContext, useState } from 'react';

import type { AppId, GamePhase, MacOSContextValue, MacOSState, WindowState } from '@/types/macos';
import type { ReactNode } from 'react';

const initialState: MacOSState = {
  openWindows: [],
  focusedWindowId: null,
  zIndexCounter: 1,
  casinoBalance: 100,
  hasPlayedCasino: false,
  gamePhase: 'normal'
};

const MacOSContext = createContext<MacOSContextValue | null>(null);

export function MacOSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MacOSState>(initialState);

  const openApp = useCallback((appId: AppId) => {
    setState((previous) => {
      const existingWindow = previous.openWindows.find((w) => w.appId === appId);
      if (existingWindow) {
        return {
          ...previous,
          focusedWindowId: existingWindow.id,
          zIndexCounter: previous.zIndexCounter + 1,
          openWindows: previous.openWindows.map((w) =>
            w.id === existingWindow.id ? { ...w, zIndex: previous.zIndexCounter + 1 } : w
          )
        };
      }

      const windowId = `${appId}-${Date.now()}`;
      const newWindow: WindowState = {
        id: windowId,
        appId,
        zIndex: previous.zIndexCounter + 1
      };

      return {
        ...previous,
        openWindows: [...previous.openWindows, newWindow],
        focusedWindowId: windowId,
        zIndexCounter: previous.zIndexCounter + 1
      };
    });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    setState((previous) => ({
      ...previous,
      openWindows: previous.openWindows.filter((w) => w.id !== windowId),
      focusedWindowId:
        previous.focusedWindowId === windowId
          ? (previous.openWindows.find((w) => w.id !== windowId)?.id ?? null)
          : previous.focusedWindowId
    }));
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setState((previous) => ({
      ...previous,
      focusedWindowId: windowId,
      zIndexCounter: previous.zIndexCounter + 1,
      openWindows: previous.openWindows.map((w) =>
        w.id === windowId ? { ...w, zIndex: previous.zIndexCounter + 1 } : w
      )
    }));
  }, []);

  const updateBalance = useCallback((delta: number) => {
    setState((previous) => ({
      ...previous,
      casinoBalance: Math.max(0, previous.casinoBalance + delta)
    }));
  }, []);

  const markCasinoPlayed = useCallback(() => {
    setState((previous) => ({
      ...previous,
      hasPlayedCasino: true
    }));
  }, []);

  const triggerExplosion = useCallback(() => {
    setState((previous) => ({
      ...previous,
      gamePhase: 'exploding' as GamePhase
    }));
  }, []);

  const showDinoGame = useCallback(() => {
    setState((previous) => ({
      ...previous,
      gamePhase: 'dino' as GamePhase
    }));
  }, []);

  const value: MacOSContextValue = {
    ...state,
    openApp,
    closeWindow,
    focusWindow,
    updateBalance,
    markCasinoPlayed,
    triggerExplosion,
    showDinoGame
  };

  return <MacOSContext.Provider value={value}>{children}</MacOSContext.Provider>;
}

export function useMacOS() {
  const context = useContext(MacOSContext);
  if (!context) {
    throw new Error('useMacOS must be used within a MacOSProvider');
  }
  return context;
}
