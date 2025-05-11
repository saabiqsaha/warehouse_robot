export interface Point {
  x: number;
  y: number;
}

export interface MultiGridObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

export interface WarehouseState {
  warehouseWidth: number;
  warehouseHeight: number;
  cellSize: number;
  obstacles: Set<string>;
  multiGridObstacles: MultiGridObstacle[];
  startPoint: Point | null;
  endPoint: Point | null;
  currentPath: Point[];
  robotPosition: Point | null;
  currentMode: string;
  animationInProgress: boolean;
  animationSpeed: number;
  presetSprites?: Record<string, string>;
}

export interface ObstacleTemplate {
  width: number;
  height: number;
  type: string;
}

export interface ObstaclePoint {
  x: number;
  y: number;
  type: string;
  width?: number;
  height?: number;
}

export interface PresetEnvironment {
  name: string;
  width: number;
  height: number;
  description: string;
  obstacles: ObstaclePoint[];
  startPoint: Point;
  endPoint: Point;
}

export interface Colors {
  gridLines: string;
  text: string;
  floor: string;
  obstacle: {
    crate: string;
    shelf: string;
    restricted: string;
    default: string;
  };
  startPoint: string;
  endPoint: string;
  path: string;
  pathHighlight: string;
  robot: string;
  status: {
    success: string;
    error: string;
    info: string;
  };
}
