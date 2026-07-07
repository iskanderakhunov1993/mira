import type { HealthSnapshot } from "../types/health";
import { buildStoreStateFromLocalData } from "./localDataToStore";
import { mergeHealthSnapshotIntoLegacy } from "./healthSnapshotBridge";
import { readData, writeData } from "./store";
import type { MiraLocalData } from "./types";
import { useMiraStore } from "../store";

export function syncDerivedStoresFromHealthSnapshot(snapshot: HealthSnapshot): MiraLocalData {
  const nextLegacyData = mergeHealthSnapshotIntoLegacy(readData(), snapshot);
  writeData(nextLegacyData);

  if (nextLegacyData.profile) {
    useMiraStore.setState((state) => ({
      ...state,
      ...buildStoreStateFromLocalData(nextLegacyData),
    }));
  }

  return nextLegacyData;
}
