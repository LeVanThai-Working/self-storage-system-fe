import type {
  StorageUnitInventoryTreeResponse,
  TreeTierItem,
} from "@self-storage-system-fe/shared";

export type StockActionType = "in" | "out" | "move" | "adjust";

/** A stock form opened from a position: `tierId === null` means floor (unracked) items. */
export interface StockFormTarget {
  type: StockActionType;
  tierId: string | null;
  item?: TreeTierItem;
}

export interface StockFormBaseProps {
  visible: boolean;
  onClose: () => void;
  contractId: string;
  storageUnitId: string;
  tree: StorageUnitInventoryTreeResponse;
  target: StockFormTarget;
  /** Lets the screen react to business errors (e.g. switch to read-only on contract not active). */
  onApiError: (messageCode?: string) => void;
}
