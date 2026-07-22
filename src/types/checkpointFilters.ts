export interface CheckpointFilters {
  siteId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  // name strings for matching against checkpoint table data
  siteName: string;
  buildingName: string;
  floorName: string;
  roomName: string;
}

export const EMPTY_CP_FILTERS: CheckpointFilters = {
  siteId: "",
  buildingId: "",
  floorId: "",
  roomId: "",
  siteName: "",
  buildingName: "",
  floorName: "",
  roomName: "",
};
