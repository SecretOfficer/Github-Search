import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SortType = "stars" | "forks" | "updated";

interface AppState {
    orgName: string;
    sortType: SortType;
    pat: string | null;
    setOrgName: (name: string) => void;
    setSortType: (type: SortType) => void;
    setPat: (token: string | null) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            orgName: "",
            sortType: "stars",
            pat: null,
            setOrgName: (name) => set({ orgName: name }),
            setSortType: (type) => set({ sortType: type }),
            setPat: (token) => set({ pat: token }),
        }),
        {
            name: "github-dashboard-storage",
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);
