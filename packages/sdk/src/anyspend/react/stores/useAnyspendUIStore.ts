import { create } from "zustand";

export enum PanelView {
  MAIN,
  HISTORY,
  ORDER_DETAILS,
  LOADING,
  FIAT_PAYMENT,
  RECIPIENT_SELECTION,
  CRYPTO_PAYMENT_METHOD,
  FIAT_PAYMENT_METHOD,
  POINTS_DETAIL,
  FEE_DETAIL,
}

interface AnyspendUIStore {
  // Panel state
  activePanel: PanelView;
  previousPanel: PanelView;
  animationDirection: "forward" | "back" | null;
  
  // Tab state
  activeTab: "crypto" | "fiat";
  
  // Actions
  setActivePanel: (panel: PanelView) => void;
  navigateToPanel: (panel: PanelView, direction?: "forward" | "back") => void;
  navigateBack: () => void;
  setActiveTab: (tab: "crypto" | "fiat") => void;
  
  // Reset
  reset: () => void;
}

export const useAnyspendUIStore = create<AnyspendUIStore>((set, get) => ({
  activePanel: PanelView.MAIN,
  previousPanel: PanelView.MAIN,
  animationDirection: null,
  activeTab: "crypto",
  
  setActivePanel: (panel) => set({ activePanel: panel }),
  
  navigateToPanel: (panel, direction = "forward") => {
    const currentPanel = get().activePanel;
    set({
      previousPanel: currentPanel,
      animationDirection: direction,
      activePanel: panel,
    });
  },
  
  navigateBack: () => {
    const { previousPanel, activePanel } = get();
    const targetPanel = previousPanel !== activePanel ? previousPanel : PanelView.MAIN;
    set({
      animationDirection: "back",
      activePanel: targetPanel,
    });
  },
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  reset: () => set({
    activePanel: PanelView.MAIN,
    previousPanel: PanelView.MAIN,
    animationDirection: null,
    activeTab: "crypto",
  }),
}));

