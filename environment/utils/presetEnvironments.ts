import { PresetEnvironment } from '../types/types';

export interface ExtendedObstaclePoint {
  x: number;
  y: number;
  type: string;
  width?: number;
  height?: number;
}

// Define preset environments with specific layouts
export const presetEnvironments: Record<string, PresetEnvironment> = {
  "amazon": {
    name: "Amazon Fulfillment Center",
    width: 25,
    height: 20,
    description: "A large warehouse with organized shelving units and sorting areas",
    obstacles: [
      // Wall borders on top and bottom
      ...[...Array(25)].map((_, i) => ({ x: i, y: 0, type: 'wall' })),
      ...[...Array(25)].map((_, i) => ({ x: i, y: 19, type: 'wall' })),
      
      // Wall borders on left and right (excluding entrance/exits)
      ...[...Array(18)].map((_, i) => ({ x: 0, y: i + 1, type: 'wall' })),
      ...[...Array(18)].map((_, i) => ({ x: 24, y: i + 1, type: 'wall' })),
      
      // Shelving units (boxes) in an organized pattern
      // First row of shelves
      ...[...Array(3)].map((_, i) => ({ x: 4, y: 3 + i * 2, type: 'box' })),
      ...[...Array(3)].map((_, i) => ({ x: 5, y: 3 + i * 2, type: 'box' })),
      
      // Second row of shelves
      ...[...Array(3)].map((_, i) => ({ x: 9, y: 3 + i * 2, type: 'box' })),
      ...[...Array(3)].map((_, i) => ({ x: 10, y: 3 + i * 2, type: 'box' })),
      
      // Third row of shelves
      ...[...Array(3)].map((_, i) => ({ x: 14, y: 3 + i * 2, type: 'box' })),
      ...[...Array(3)].map((_, i) => ({ x: 15, y: 3 + i * 2, type: 'box' })),
      
      // Fourth row of shelves
      ...[...Array(3)].map((_, i) => ({ x: 19, y: 3 + i * 2, type: 'box' })),
      ...[...Array(3)].map((_, i) => ({ x: 20, y: 3 + i * 2, type: 'box' })),
      
      // Sorting area (humans)
      { x: 7, y: 15, type: 'human' },
      { x: 12, y: 15, type: 'human' },
      { x: 17, y: 15, type: 'human' },
      
      // Scattered items
      { x: 3, y: 10, type: 'item' },
      { x: 8, y: 12, type: 'item' },
      { x: 13, y: 8, type: 'item' },
      { x: 18, y: 10, type: 'item' },
      { x: 22, y: 5, type: 'item' },
      
      // Fork lift areas
      { x: 3, y: 17, type: 'fork' },
      { x: 21, y: 17, type: 'fork' },
      
      // Large multi-grid obstacles (storage racks)
      { x: 7, y: 4, type: 'box', width: 3, height: 2 },
      { x: 16, y: 4, type: 'box', width: 3, height: 2 },
      { x: 12, y: 10, type: 'box', width: 4, height: 2 }
    ],
    startPoint: { x: 12, y: 2 },
    endPoint: { x: 12, y: 17 }
  },
  
  "nvidia": {
    name: "NVIDIA GPU Factory",
    width: 22,
    height: 18,
    description: "High-tech GPU manufacturing facility with clean room areas",
    obstacles: [
      // Exterior walls
      ...[...Array(22)].map((_, i) => ({ x: i, y: 0, type: 'wall' })),
      ...[...Array(22)].map((_, i) => ({ x: i, y: 17, type: 'wall' })),
      ...[...Array(16)].map((_, i) => ({ x: 0, y: i + 1, type: 'wall' })),
      ...[...Array(16)].map((_, i) => ({ x: 21, y: i + 1, type: 'wall' })),
      
      // Clean room barriers
      ...[...Array(10)].map((_, i) => ({ x: 7, y: i + 2, type: 'wall' })),
      ...[...Array(10)].map((_, i) => ({ x: 14, y: i + 2, type: 'wall' })),
      { x: 8, y: 2, type: 'wall' },
      { x: 9, y: 2, type: 'wall' },
      { x: 10, y: 2, type: 'wall' },
      { x: 11, y: 2, type: 'wall' },
      { x: 12, y: 2, type: 'wall' },
      { x: 13, y: 2, type: 'wall' },
      
      // Production equipment (boxes)
      { x: 2, y: 3, type: 'box' },
      { x: 3, y: 3, type: 'box' },
      { x: 4, y: 3, type: 'box' },
      { x: 2, y: 6, type: 'box' },
      { x: 3, y: 6, type: 'box' },
      { x: 4, y: 6, type: 'box' },
      { x: 2, y: 9, type: 'box' },
      { x: 3, y: 9, type: 'box' },
      { x: 4, y: 9, type: 'box' },
      
      // Testing stations (humans)
      { x: 3, y: 13, type: 'human' },
      { x: 10, y: 13, type: 'human' },
      { x: 17, y: 13, type: 'human' },
      
      // GPU components (items)
      { x: 9, y: 5, type: 'item' },
      { x: 11, y: 5, type: 'item' },
      { x: 9, y: 8, type: 'item' },
      { x: 11, y: 8, type: 'item' },
      { x: 17, y: 6, type: 'item' },
      { x: 17, y: 9, type: 'item' },
      
      // Equipment (forklifts)
      { x: 5, y: 15, type: 'fork' },
      { x: 17, y: 15, type: 'fork' },
      
      // Large manufacturing equipment (multi-grid)
      { x: 2, y: 2, type: 'box', width: 4, height: 3 },
      { x: 16, y: 4, type: 'box', width: 3, height: 5 },
      { x: 9, y: 9, type: 'human', width: 3, height: 2 }, // Quality control area
    ],
    startPoint: { x: 10, y: 15 },
    endPoint: { x: 10, y: 5 }
  },
  
  "tesla": {
    name: "Tesla Gigafactory",
    width: 28,
    height: 22,
    description: "Massive electric vehicle production facility with assembly lines",
    obstacles: [
      // Factory exterior walls
      ...[...Array(28)].map((_, i) => ({ x: i, y: 0, type: 'wall' })),
      ...[...Array(28)].map((_, i) => ({ x: i, y: 21, type: 'wall' })),
      ...[...Array(20)].map((_, i) => ({ x: 0, y: i + 1, type: 'wall' })),
      ...[...Array(20)].map((_, i) => ({ x: 27, y: i + 1, type: 'wall' })),
      
      // Assembly line walls
      ...[...Array(15)].map((_, i) => ({ x: 9, y: i + 3, type: 'wall' })),
      ...[...Array(15)].map((_, i) => ({ x: 18, y: i + 3, type: 'wall' })),
      
      // Battery production area (boxes)
      { x: 3, y: 3, type: 'box' },
      { x: 4, y: 3, type: 'box' },
      { x: 5, y: 3, type: 'box' },
      { x: 6, y: 3, type: 'box' },
      { x: 3, y: 4, type: 'box' },
      { x: 6, y: 4, type: 'box' },
      { x: 3, y: 5, type: 'box' },
      { x: 6, y: 5, type: 'box' },
      { x: 3, y: 6, type: 'box' },
      { x: 4, y: 6, type: 'box' },
      { x: 5, y: 6, type: 'box' },
      { x: 6, y: 6, type: 'box' },
      
      // Car body assembly (boxes)
      { x: 21, y: 3, type: 'box' },
      { x: 22, y: 3, type: 'box' },
      { x: 23, y: 3, type: 'box' },
      { x: 24, y: 3, type: 'box' },
      { x: 21, y: 4, type: 'box' },
      { x: 24, y: 4, type: 'box' },
      { x: 21, y: 5, type: 'box' },
      { x: 24, y: 5, type: 'box' },
      { x: 21, y: 6, type: 'box' },
      { x: 22, y: 6, type: 'box' },
      { x: 23, y: 6, type: 'box' },
      { x: 24, y: 6, type: 'box' },
      
      // Central assembly line stations (humans)
      { x: 13, y: 5, type: 'human' },
      { x: 13, y: 9, type: 'human' },
      { x: 13, y: 13, type: 'human' },
      { x: 13, y: 17, type: 'human' },
      
      // Component supplies (items)
      { x: 3, y: 10, type: 'item' },
      { x: 5, y: 10, type: 'item' },
      { x: 3, y: 14, type: 'item' },
      { x: 5, y: 14, type: 'item' },
      { x: 21, y: 10, type: 'item' },
      { x: 23, y: 10, type: 'item' },
      { x: 21, y: 14, type: 'item' },
      { x: 23, y: 14, type: 'item' },
      
      // Forklifts
      { x: 4, y: 18, type: 'fork' },
      { x: 13, y: 20, type: 'fork' },
      { x: 22, y: 18, type: 'fork' },
      
      // Large car assembly areas (multi-grid)
      { x: 12, y: 4, type: 'box', width: 5, height: 3 },
      { x: 12, y: 11, type: 'box', width: 5, height: 3 },
      { x: 2, y: 8, type: 'human', width: 4, height: 2 }, // Worker station
      { x: 22, y: 8, type: 'human', width: 4, height: 2 }, // Worker station
    ],
    startPoint: { x: 4, y: 12 },
    endPoint: { x: 22, y: 12 }
  }
};

// Helper function to get a preset environment by its key
export const getPresetEnvironment = (key: string): PresetEnvironment | null => {
  return presetEnvironments[key] || null;
};
