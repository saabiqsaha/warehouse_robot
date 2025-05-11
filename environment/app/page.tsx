'use client';

import React, { useEffect, useState } from 'react';
import WarehouseCanvas from '../components/WarehouseCanvas';
import ControlPanel from '../components/ControlPanel';
import { WarehouseState, Point, MultiGridObstacle, ObstacleTemplate } from '../types/types';

// Define a type for our preset environments
interface PresetEnvironment {
  name: string;
  warehouseWidth: number;
  warehouseHeight: number;
  startPoint: Point;
  endPoint: Point;
  robotPosition: Point;
  multiGridObstacles: MultiGridObstacle[];
}

const PREDEFINED_ENVIRONMENTS: PresetEnvironment[] = [
  {
    name: "Amazon Fulfilment Center 1",
    warehouseWidth: 30,
    warehouseHeight: 20,
    startPoint: { x: 1, y: 1 },
    endPoint: { x: 28, y: 18 },
    robotPosition: { x: 1, y: 1 },
    multiGridObstacles: [
      { x: 0, y: 5, width: 1, height: 10, type: 'wall', sprite: '/sprites/wall.png' }, // Left boundary wall
      { x: 29, y: 5, width: 1, height: 10, type: 'wall', sprite: '/sprites/wall.png' }, // Right boundary wall
      { x: 5, y: 0, width: 10, height: 1, type: 'wall', sprite: '/sprites/wall.png' }, // Top boundary wall
      { x: 5, y: 19, width: 10, height: 1, type: 'wall', sprite: '/sprites/wall.png' }, // Bottom boundary wall

      { x: 5, y: 2, width: 2, height: 5, type: 'shelf', sprite: '/sprites/wall.png' }, // Shelf unit (using wall sprite)
      { x: 8, y: 2, width: 2, height: 5, type: 'shelf', sprite: '/sprites/wall.png' },
      
      { x: 12, y: 8, width: 3, height: 3, type: 'box', sprite: '/sprites/box.png' },    // Large stack of boxes
      { x: 16, y: 8, width: 1, height: 1, type: 'human', sprite: '/sprites/human.png' }, // Human worker
      { x: 18, y: 12, width: 1, height: 1, type: 'box', sprite: '/sprites/box.png' },    // Single box

      { x: 22, y: 5, width: 1, height: 4, type: 'shelf', sprite: '/sprites/wall.png' }, // Tall narrow shelf
      { x: 25, y: 15, width: 3, height: 1, type: 'box', sprite: '/sprites/box.png' },   // Row of boxes
    ],
  },
  {
    name: "Nvidia GPU Farm",
    warehouseWidth: 25,
    warehouseHeight: 25,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 24, y: 24 },
    robotPosition: { x: 0, y: 0 },
    multiGridObstacles: [
      { x: 5, y: 5, width: 2, height: 7, type: 'restricted', sprite: '/sprites/wall.png' }, // Server rack area
      { x: 5, y: 15, width: 2, height: 7, type: 'restricted', sprite: '/sprites/wall.png' },
      { x: 10, y: 5, width: 2, height: 7, type: 'restricted', sprite: '/sprites/wall.png' },
      { x: 10, y: 15, width: 2, height: 7, type: 'restricted', sprite: '/sprites/wall.png' },
      
      { x: 15, y: 8, width: 1, height: 1, type: 'human', sprite: '/sprites/human.png' },  // Technician
      { x: 18, y: 18, width: 3, height: 3, type: 'box', sprite: '/sprites/box.png' },    // Shipment of GPUs
      { x: 2, y: 10, width: 1, height: 1, type: 'box', sprite: '/sprites/box.png' },
      { x: 20, y: 2, width: 4, height: 1, type: 'wall', sprite: '/sprites/wall.png' },   // Cable run / conduit
    ],
  },
  {
    name: "Tesla Gigafactory 2",
    warehouseWidth: 40,
    warehouseHeight: 30,
    startPoint: { x: 2, y: 2 },
    endPoint: { x: 38, y: 28 },
    robotPosition: { x: 2, y: 2 },
    multiGridObstacles: [
      { x: 5, y: 5, width: 1, height: 20, type: 'wall', sprite: '/sprites/wall.png' },  // Long assembly line wall
      { x: 15, y: 10, width: 10, height: 2, type: 'shelf', sprite: '/sprites/wall.png' }, // Parts storage shelf
      { x: 15, y: 15, width: 10, height: 2, type: 'shelf', sprite: '/sprites/wall.png' },
      
      { x: 30, y: 5, width: 5, height: 5, type: 'restricted', sprite: '/sprites/wall.png' }, // Battery assembly area
      { x: 32, y: 8, width: 1, height: 1, type: 'human', sprite: '/sprites/human.png' },     // Worker in area

      { x: 8, y: 25, width: 3, height: 3, type: 'box', sprite: '/sprites/box.png' },     // Crate of components
      { x: 25, y: 25, width: 1, height: 1, type: 'human', sprite: '/sprites/human.png' },  // Inspector
      { x: 20, y: 3, width: 1, height: 1, type: 'box', sprite: '/sprites/box.png' },
    ],
  },
];

export default function Home() {
  // Constants
  const BASE_API_URL = '/api';
  const cellSize = 35;
  
  // Obstacle templates for multi-grid obstacles
  const obstacleTemplates: Record<string, ObstacleTemplate> = {
    small_shelf: {
      width: 1,
      height: 3,
      type: 'shelf'
    },
    large_shelf: {
      width: 2,
      height: 5,
      type: 'shelf'
    },
    crate_stack: {
      width: 3,
      height: 2,
      type: 'crate'
    },
    restricted_area: {
      width: 3,
      height: 3,
      type: 'restricted'
    },
    small_crate: {
      width: 1,
      height: 1,
      type: 'crate'
    }
  };
  
  // Obstacle types for the dropdown
  const obstacleTypes = [
    { value: 'crate', label: 'Crate' },
    { value: 'shelf', label: 'Shelf Unit' },
    { value: 'restricted', label: 'Restricted Zone' }
  ];
  
  // State
  const [warehouseState, setWarehouseState] = useState<WarehouseState>({
    warehouseWidth: 20,
    warehouseHeight: 15,
    cellSize: cellSize,
    obstacles: new Set<string>(),
    multiGridObstacles: [],
    startPoint: null,
    endPoint: null,
    currentPath: [],
    robotPosition: null,
    currentMode: 'none',
    animationInProgress: false,
    animationSpeed: 300 // milliseconds between steps
  });
  
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [statusLog, setStatusLog] = useState<{ message: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);
  const [selectedObstacleType, setSelectedObstacleType] = useState<string>('crate');
  const [selectedPreset, setSelectedPreset] = useState<string>(''); // Added for preset selection
  
  // Helper function to update status message
  const updateStatusMessage = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    
    // Add to log
    setStatusLog(prev => {
      const newLog = [{ message, type }, ...prev];
      // Limit log size
      return newLog.slice(0, 20);
    });
  };

  // Initialize warehouse
  const initializeWarehouse = async (width?: number, height?: number) => {
    const w = width ?? warehouseState.warehouseWidth;
    const h = height ?? warehouseState.warehouseHeight;
    
    if (w <= 0 || h <= 0) {
      updateStatusMessage("Valid positive integers required for width and height.", 'error');
      return;
    }
    
    updateStatusMessage(`Initializing warehouse: ${w}x${h}...`, 'info');
    
    try {
      const response = await fetch(`${BASE_API_URL}/initialize_warehouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width: w, height: h })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state with response data
      const newObstacles = new Set<string>();
      data.obstacles.forEach((obs: number[]) => newObstacles.add(`${obs[0]},${obs[1]}`));
      
      setWarehouseState((prev: WarehouseState) => ({
        ...prev,
        warehouseWidth: data.width,
        warehouseHeight: data.height,
        obstacles: newObstacles,
        startPoint: null,
        endPoint: null,
        currentPath: [],
        robotPosition: null,
        currentMode: 'none'
      }));
      
      updateStatusMessage(data.message || `Warehouse ${w}x${h} initialized.`, 'success');
    } catch (error) {
      console.error("Error initializing warehouse:", error);
      updateStatusMessage(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Set mode functions
  const setStartMode = () => {
    if (selectedPreset) {
      updateStatusMessage("Modifying start point is disabled when a preset is loaded. Clear simulation to customize.", 'error');
      return;
    }
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentMode: 'set_start' }));
    updateStatusMessage("Click on the grid to set robot start position.", 'info');
  };
  
  const setEndMode = () => {
    if (selectedPreset) {
      updateStatusMessage("Modifying end point is disabled when a preset is loaded. Clear simulation to customize.", 'error');
      return;
    }
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentMode: 'set_end' }));
    updateStatusMessage("Click on the grid to set destination point.", 'info');
  };
  
  const setToggleObstacleMode = () => {
    if (selectedPreset) {
      updateStatusMessage("Modifying obstacles is disabled when a preset is loaded. Clear simulation to customize.", 'error');
      return;
    }
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentMode: 'toggle_obstacle' }));
    updateStatusMessage("Click on grid cells to place or remove obstacles.", 'info');
  };
  
  const setPlaceMultiGridMode = () => {
    if (selectedPreset) {
      updateStatusMessage("Modifying obstacles is disabled when a preset is loaded. Clear simulation to customize.", 'error');
      return;
    }
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentMode: 'place_multi_grid' }));
    updateStatusMessage("Click on the grid to place a multi-grid obstacle. Will use the selected obstacle type.", 'info');
  };

  // Handle canvas click
  const handleCanvasClick = async (gridX: number, gridY: number) => {
    const { currentMode, obstacles, startPoint, endPoint } = warehouseState;
    
    let successMessage = "";
    let needsRedraw = false;
    
    if (currentMode === 'set_start') {
      if (obstacles.has(`${gridX},${gridY}`)) {
        updateStatusMessage("Cannot set start point on an obstacle.", 'error');
        return;
      }
      
      setWarehouseState((prev: WarehouseState) => ({
        ...prev,
        startPoint: { x: gridX, y: gridY },
        robotPosition: { x: gridX, y: gridY },
        currentMode: 'none'
      }));
      
      successMessage = `Start point set at (${gridX},${gridY}).`;
      needsRedraw = true;
    } 
    else if (currentMode === 'set_end') {
      if (obstacles.has(`${gridX},${gridY}`)) {
        updateStatusMessage("Cannot set end point on an obstacle.", 'error');
        return;
      }
      
      if (startPoint && startPoint.x === gridX && startPoint.y === gridY) {
        updateStatusMessage("End point cannot be the same as the start point.", 'error');
        return;
      }
      
      setWarehouseState((prev: WarehouseState) => ({
        ...prev,
        endPoint: { x: gridX, y: gridY },
        currentMode: 'none'
      }));
      
      successMessage = `End point set at (${gridX},${gridY}).`;
      needsRedraw = true;
    } 
    else if (currentMode === 'toggle_obstacle') {
      if (startPoint && startPoint.x === gridX && startPoint.y === gridY) {
        updateStatusMessage("Cannot place obstacle on start point.", 'error');
        return;
      }
      
      if (endPoint && endPoint.x === gridX && endPoint.y === gridY) {
        updateStatusMessage("Cannot place obstacle on end point.", 'error');
        return;
      }
      
      const obsKey = `${gridX},${gridY}`;
      
      // Determine action based on whether obstacle exists
      let action = obstacles.has(obsKey) ? 'DELETE' : 'POST';
      
      try {
        const response = await fetch(`${BASE_API_URL}/obstacle`, {
          method: action,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: gridX, y: gridY })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update local obstacles from backend response
        const newObstacles = new Set<string>();
        data.obstacles.forEach((obs: number[]) => {
          newObstacles.add(`${obs[0]},${obs[1]}`);
        });
        
        setWarehouseState((prev: WarehouseState) => ({
          ...prev,
          obstacles: newObstacles
        }));
        
        successMessage = data.message;
        needsRedraw = true;
      } catch (error) {
        console.error(`Error ${action === 'POST' ? 'adding' : 'removing'} obstacle:`, error);
        updateStatusMessage(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        return;
      }
    } 
    else if (currentMode === 'place_multi_grid') {
      // Handle placing multi-grid obstacles
      // Determine which template to use based on the selected type
      let template: ObstacleTemplate;
      
      if (selectedObstacleType === 'shelf') {
        // Randomly choose between small and large shelf
        template = Math.random() > 0.5 ? obstacleTemplates.small_shelf : obstacleTemplates.large_shelf;
      } else if (selectedObstacleType === 'crate') {
        // Randomly choose between single crate and crate stack
        template = Math.random() > 0.3 ? obstacleTemplates.crate_stack : obstacleTemplates.small_crate;
      } else if (selectedObstacleType === 'restricted') {
        template = obstacleTemplates.restricted_area;
      } else {
        template = obstacleTemplates.small_crate; // Default
      }
      
      // Check if we can place this multi-grid obstacle
      if (isValidForMultiGridObstacle(gridX, gridY, template.width, template.height)) {
        // Add the multi-grid obstacle
        const newMultiGridObstacle: MultiGridObstacle = {
          x: gridX,
          y: gridY,
          width: template.width,
          height: template.height,
          type: selectedObstacleType
        };
        
        setWarehouseState((prev: WarehouseState) => ({
          ...prev,
          multiGridObstacles: [...prev.multiGridObstacles, newMultiGridObstacle],
          currentMode: 'none'
        }));
        
        // Mark all individual cells as occupied in the backend
        for (let i = 0; i < template.width; i++) {
          for (let j = 0; j < template.height; j++) {
            const obsX = gridX + i;
            const obsY = gridY + j;
            
            try {
              await fetch(`${BASE_API_URL}/obstacle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: obsX, y: obsY })
              });
            } catch (error) {
              console.error(`Error adding obstacle at (${obsX},${obsY}):`, error);
            }
          }
        }
        
        successMessage = `${selectedObstacleType.charAt(0).toUpperCase() + selectedObstacleType.slice(1)} placed at (${gridX},${gridY}).`;
        needsRedraw = true;
      } else {
        updateStatusMessage("Cannot place obstacle in this location. Space is occupied or out of bounds.", 'error');
      }
    } else {
      updateStatusMessage("Select a mode (Set Start, Set End, Place Obstacles) to interact with the grid.", 'info');
    }
    
    if (successMessage && needsRedraw) {
      updateStatusMessage(successMessage, 'success');
    }
  };

  // Check if a location is valid for placing a multi-grid obstacle
  const isValidForMultiGridObstacle = (x: number, y: number, width: number, height: number): boolean => {
    const { warehouseWidth, warehouseHeight, obstacles, multiGridObstacles, startPoint, endPoint } = warehouseState;
    
    // Check if all cells in the region are unoccupied
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const checkX = x + i;
        const checkY = y + j;
        
        // Check bounds
        if (checkX >= warehouseWidth || checkY >= warehouseHeight) {
          return false;
        }
        
        // Check for obstacles
        if (obstacles.has(`${checkX},${checkY}`)) {
          return false;
        }
        
        // Check for other multi-grid obstacles
        let occupiedByMultiGrid = false;
        for (const obstacle of multiGridObstacles) {
          if (checkX >= obstacle.x && checkX < obstacle.x + obstacle.width &&
              checkY >= obstacle.y && checkY < obstacle.y + obstacle.height) {
            occupiedByMultiGrid = true;
            break;
          }
        }
        if (occupiedByMultiGrid) {
          return false;
        }
        
        // Check for start/end points
        if (startPoint && startPoint.x === checkX && startPoint.y === checkY) {
          return false;
        }
        if (endPoint && endPoint.x === checkX && endPoint.y === checkY) {
          return false;
        }
      }
    }
    return true;
  };

  // Find path
  const findPath = async () => {
    const { startPoint, endPoint, warehouseWidth } = warehouseState;
    
    if (!startPoint || !endPoint) {
      updateStatusMessage("Please set both start and end points before finding a path.", 'error');
      return;
    }
    
    if (warehouseWidth === 0) {
      updateStatusMessage("Please initialize the warehouse first.", 'error');
      return;
    }
    
    // Stop any existing animation
    if (warehouseState.animationInProgress && animationFrame !== null) {
      clearTimeout(animationFrame);
      setAnimationFrame(null);
      setWarehouseState((prev: WarehouseState) => ({ ...prev, animationInProgress: false }));
    }
    
    updateStatusMessage("Calculating route...", 'info');
    
    // Clear previous path
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentPath: [] }));
    
    try {
      const response = await fetch(`${BASE_API_URL}/plan_path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: { x: startPoint.x, y: startPoint.y },
          end: { x: endPoint.x, y: endPoint.y }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.path && data.path.length > 0) {
        setWarehouseState((prev: WarehouseState) => ({ ...prev, currentPath: data.path }));
        updateStatusMessage(`Path found with ${data.path.length} steps. Starting robot...`, 'success');
        
        // Start the robot animation
        startRobotAnimation();
      } else {
        updateStatusMessage(data.message || "No path could be found.", 'info');
      }
    } catch (error) {
      console.error('Error finding path:', error);
      updateStatusMessage(`Pathfinding error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Robot animation functions
  const animateRobot = () => {
    const { robotPosition, currentPath, startPoint, animationSpeed } = warehouseState;
    
    if (!robotPosition || currentPath.length <= 1 || !startPoint) {
      setWarehouseState((prev: WarehouseState) => ({ ...prev, animationInProgress: false }));
      return;
    }
    
    // Find the current position in the path
    let currentIndex = 0;
    for (let i = 0; i < currentPath.length; i++) {
      if (currentPath[i].x === robotPosition.x && currentPath[i].y === robotPosition.y) {
        currentIndex = i;
        break;
      }
    }
    
    // If we've reached the end, stop animation
    if (currentIndex >= currentPath.length - 1) {
      setWarehouseState((prev: WarehouseState) => ({ ...prev, animationInProgress: false }));
      updateStatusMessage("Robot reached the destination!", 'success');
      return;
    }
    
    // Move to the next point in the path
    const nextPosition = currentPath[currentIndex + 1];
    
    setWarehouseState((prev: WarehouseState) => ({
      ...prev,
      robotPosition: { ...nextPosition }
    }));
    
    // Schedule the next animation frame
    const frameId = window.setTimeout(() => {
      animateRobot();
    }, animationSpeed);
    
    setAnimationFrame(frameId);
  };
  
  const startRobotAnimation = () => {
    const { animationInProgress, currentPath, startPoint } = warehouseState;
    
    if (animationInProgress) return;
    
    if (!currentPath.length || !startPoint) {
      updateStatusMessage("No path available for robot to follow.", 'error');
      return;
    }
    
    // Set robot at start position
    setWarehouseState((prev: WarehouseState) => ({
      ...prev,
      robotPosition: { ...startPoint },
      animationInProgress: true
    }));
    
    // Clear any existing animation
    if (animationFrame !== null) {
      clearTimeout(animationFrame);
      setAnimationFrame(null);
    }
    
    // Start animation
    updateStatusMessage("Robot is moving to destination...", 'info');
    
    // Schedule first animation frame
    const frameId = window.setTimeout(() => {
      animateRobot();
    }, warehouseState.animationSpeed);
    
    setAnimationFrame(frameId);
  };

  // Load a predefined environment
  const loadPresetEnvironment = async (presetName: string) => {
    const preset = PREDEFINED_ENVIRONMENTS.find(p => p.name === presetName);
    if (!preset) {
      updateStatusMessage(`Preset environment "${presetName}" not found.`, 'error');
      return;
    }

    updateStatusMessage(`Loading preset: ${preset.name}...`, 'info');
    setSelectedPreset(preset.name);

    // Temporarily set state for initialization call
    setWarehouseState(prev => ({
      ...prev,
      warehouseWidth: preset.warehouseWidth,
      warehouseHeight: preset.warehouseHeight,
      startPoint: preset.startPoint,
      endPoint: preset.endPoint,
      robotPosition: preset.robotPosition,
      multiGridObstacles: preset.multiGridObstacles,
      obstacles: new Set<string>(), // Clear local obstacles, will be repopulated
      currentPath: [],
      animationInProgress: false,
      currentMode: 'none',
    }));

    // 1. Initialize the backend warehouse with new dimensions (this should clear backend obstacles)
    try {
      const initResponse = await fetch(`${BASE_API_URL}/initialize_warehouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width: preset.warehouseWidth, height: preset.warehouseHeight })
      });
      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || `HTTP error! Status: ${initResponse.status}`);
      }
      const initData = await initResponse.json();
      updateStatusMessage(initData.message || `Warehouse for ${preset.name} initialized.`, 'info');

      // Backend obstacles are now clear.
      // Create a new Set for the frontend's 'obstacles' based on the preset's multiGridObstacles
      const newBackendObstaclesSet = new Set<string>();
      for (const obstacle of preset.multiGridObstacles) {
        for (let i = 0; i < obstacle.width; i++) {
          for (let j = 0; j < obstacle.height; j++) {
            const obsX = obstacle.x + i;
            const obsY = obstacle.y + j;
            newBackendObstaclesSet.add(`${obsX},${obsY}`);
          }
        }
      }
      
      // Update the state fully now, including the correctly populated 'obstacles' set
      setWarehouseState(prev => ({
        ...prev, // Keep width, height, start, end, robotPos, multiGrid from above
        warehouseWidth: preset.warehouseWidth,
        warehouseHeight: preset.warehouseHeight,
        startPoint: preset.startPoint,
        endPoint: preset.endPoint,
        robotPosition: preset.robotPosition,
        multiGridObstacles: preset.multiGridObstacles,
        obstacles: newBackendObstaclesSet, // Set the frontend obstacles based on multiGrid
        currentPath: [],
        animationInProgress: false,
        currentMode: 'none',
      }));

      // 2. Add obstacles to the backend
      // We need to ensure this happens *after* the state is updated with newBackendObstaclesSet if any checks rely on it.
      // However, the backend takes individual obstacle cells.
      for (const obsKey of Array.from(newBackendObstaclesSet)) {
        const [xStr, yStr] = obsKey.split(',');
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        try {
          const obsResponse = await fetch(`${BASE_API_URL}/obstacle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y })
          });
          if (!obsResponse.ok) {
            const errorData = await obsResponse.json();
            console.warn(`Failed to add obstacle at (${x},${y}) for preset: ${errorData.error || obsResponse.status}`);
          }
        } catch (error) {
          console.warn(`Error adding obstacle at (${x},${y}) for preset: ${error}`);
        }
      }
      updateStatusMessage(`${preset.name} loaded and obstacles configured. Ready to find path.`, 'success');

    } catch (error) {
      console.error("Error loading preset environment:", error);
      updateStatusMessage(`Failed to load preset: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setSelectedPreset(''); // Reset on error
    }
  };

  // Clear simulation
  const clearSimulation = async () => {
    const { warehouseWidth, warehouseHeight } = warehouseState;
    
    if (warehouseWidth > 0 && warehouseHeight > 0) {
      updateStatusMessage("Resetting simulation by re-initializing warehouse...", 'info');
      
      // Trigger a re-initialization which clears backend obstacles too
      try {
        await fetch(`${BASE_API_URL}/initialize_warehouse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ width: warehouseWidth, height: warehouseHeight })
        });
      } catch (error) {
        console.error("Error resetting warehouse:", error);
      }
    }
    
    // Stop any animations
    if (warehouseState.animationInProgress && animationFrame !== null) {
      clearTimeout(animationFrame);
      setAnimationFrame(null);
    }
    
    // Reset state
    setWarehouseState((prev: WarehouseState) => ({
      ...prev,
      obstacles: new Set<string>(),
      multiGridObstacles: [],
      startPoint: null,
      endPoint: null,
      currentPath: [],
      robotPosition: null,
      currentMode: 'none',
      animationInProgress: false
    }));
    setSelectedPreset(''); // Also clear selected preset

    updateStatusMessage("Simulation reset. Initialize warehouse or load a preset.", 'info');
  };

  // Handle width and height changes
  const handleWidthChange = (width: number) => {
    setWarehouseState((prev: WarehouseState) => ({ ...prev, warehouseWidth: width }));
  };
  
  const handleHeightChange = (height: number) => {
    setWarehouseState((prev: WarehouseState) => ({ ...prev, warehouseHeight: height }));
  };
  
  // Handle obstacle type change
  const handleObstacleTypeChange = (type: string) => {
    setSelectedObstacleType(type);
  };

  // Initial setup
  useEffect(() => {
    // updateStatusMessage("System ready. Please initialize warehouse dimensions.", 'info');
    // Let's try to load a default preset, or prompt user to select one.
    // For now, just update message.
    updateStatusMessage("System ready. Please load a preset environment or initialize manually.", 'info');
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrame !== null) {
        clearTimeout(animationFrame);
      }
    };
  }, [animationFrame]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <WarehouseCanvas 
        warehouseState={warehouseState}
        onCanvasClick={handleCanvasClick}
      />
      <ControlPanel 
        warehouseState={warehouseState}
        statusMessage={statusMessage}
        statusType={statusType}
        statusLog={statusLog}
        obstacleTypes={obstacleTypes}
        predefinedEnvironments={PREDEFINED_ENVIRONMENTS.map(p => p.name)}
        selectedPreset={selectedPreset}
        onLoadPreset={loadPresetEnvironment}
        onInitializeWarehouse={() => {
          if (selectedPreset) {
            updateStatusMessage("Warehouse already initialized by preset. Clear simulation to re-initialize manually.", 'error');
            return;
          }
          initializeWarehouse();
        }}
        onSetStart={setStartMode}
        onSetEnd={setEndMode}
        onToggleObstacle={setToggleObstacleMode}
        onPlaceMultiGrid={setPlaceMultiGridMode}
        onFindPath={findPath}
        onClearSimulation={clearSimulation}
        onWidthChange={(width: number) => {
          if (selectedPreset) {
             updateStatusMessage("Dimensions are fixed for presets. Clear simulation to change.", 'error');
            return;
          }
          handleWidthChange(width);
        }}
        onHeightChange={(height: number) => {
           if (selectedPreset) {
             updateStatusMessage("Dimensions are fixed for presets. Clear simulation to change.", 'error');
            return;
          }
          handleHeightChange(height);
        }}
        onObstacleTypeChange={handleObstacleTypeChange}
      />
    </div>
  );
}
