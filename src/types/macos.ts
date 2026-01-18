export type AppId = 'terminal' | 'chatgbt' | 'casino';

export type GamePhase = 'normal' | 'exploding' | 'dino';

export interface WindowState {
  id: string;
  appId: AppId;
  zIndex: number;
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
  updateBalance: (delta: number) => void;
  markCasinoPlayed: () => void;
  triggerExplosion: () => void;
  showDinoGame: () => void;
}

export interface DockItem {
  id: AppId;
  icon: React.ReactNode;
  label: string;
}
