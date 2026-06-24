import type { MiraLocalData } from "@/lib/types";
import type { NavPage } from "@/components/layout/types";

export type ScreenProps = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
  navigate: (page: NavPage) => void;
  onCheckIn?: () => void;
};
