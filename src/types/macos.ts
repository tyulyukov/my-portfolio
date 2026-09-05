export type AppId = 'terminal' | 'chatgbt' | 'casino';

export type GamePhase = 'normal' | 'exploding' | 'dino';

export interface WindowState {
  id: string;
  appId: AppId;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

export interface MacOSState {
  openWindows: WindowState[];
  focusedWindowId: string | null;
  zIndexCounter: number;
  casinoBalance: number;
  hasPlayedCasino: boolean;
  gamePhase: GamePhase;
}

export interface MacOSContextValue extends MacOSState {
  openApp: (appId: AppId) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  toggleMaximizeWindow: (windowId: string) => void;
  updateBalance: (delta: number) => void;
  markCasinoPlayed: () => void;
  triggerExplosion: () => void;
  showDinoGame: () => void;
  returnToDesktop: () => void;
}

export interface DockItem {
  id: AppId;
  icon: React.ReactNode;
  label: string;
}
