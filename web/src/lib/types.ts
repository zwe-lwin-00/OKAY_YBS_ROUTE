export type CatalogRoute = {
  bus_line: string;
  route_name: string;
  line_name: string;
  agency: string;
  route_type: string;
  total_stops: number;
  qr_payment: string;
  data_file: string;
  data_url: string;
};

export type Catalog = {
  api_name: string;
  api_version: string;
  description: string;
  source_repository: string;
  base_url: string;
  route_count: number;
  routes: CatalogRoute[];
};

export type Stop = {
  index: string;
  stop_name_en: string;
  stop_name_mm: string;
  road: string;
  latitude: number;
  longitude: number;
  direction?: "outbound" | "inbound" | "one_way" | "turnaround";
  lane?: "unspecified" | "right" | "left" | "center" | "shared";
  opposite_stop_index?: string;
};

export type RouteData = {
  bus_line: string;
  route_info: {
    "Route Name": string;
    "Line Name": string;
    Agency: string;
    "Route Type": string;
    "Total Stops": string;
    "QR Payment": string;
  };
  stops: Stop[];
};

export type RouteSummary = CatalogRoute & {
  slug: string;
  qrSupported: boolean;
};

export type NearbyStop = Stop & {
  bus_line: string;
  line_name: string;
  slug: string;
  distanceMeters: number;
};

/** User-selectable place for trip planning / stop search. */
export type StopPlace = {
  id: string;
  name_en: string;
  name_mm: string;
  road: string;
  latitude: number;
  longitude: number;
  route_count: number;
  /** Same English name appears at multiple nearby curbs/sides. */
  ambiguous?: boolean;
  same_name_count?: number;
  ambiguity_hint?: string;
};

export type RideDirection = "outbound" | "inbound" | "one_way";

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type RideLeg = {
  type: "ride";
  slug: string;
  bus_line: string;
  line_name: string;
  direction: RideDirection;
  direction_label: string;
  from_stop: Stop;
  to_stop: Stop;
  from_index: number;
  to_index: number;
  stop_count: number;
  /** Ordered coordinates along this ride for map drawing. */
  path?: LatLng[];
};

export type WalkLeg = {
  type: "walk";
  from_stop: Stop;
  to_stop: Stop;
  distance_meters: number;
  reason?: "transfer" | "cross_to_lane";
};

export type TripLeg = RideLeg | WalkLeg;

export type TripPlan = {
  id: string;
  transfers: 0 | 1 | 2;
  score: number;
  total_ride_stops: number;
  total_walk_meters: number;
  summary: string;
  legs: TripLeg[];
  /** Static estimate only — not live arrival time. */
  estimated_minutes?: number;
  ride_minutes?: number;
  walk_minutes?: number;
};

export type RecentTrip = {
  from: StopPlace;
  to: StopPlace;
  savedAt: number;
};

export type ServingRoute = {
  slug: string;
  bus_line: string;
  line_name: string;
  agency: string;
  qrSupported: boolean;
  total_stops: number;
  directions: string[];
  stop_indexes: number[];
};
