'use client';

import React, { useEffect, useState } from 'react';
import WarehouseCanvas from '../components/WarehouseCanvas';
import ControlPanel from '../components/ControlPanel';
import { WarehouseState, Point, MultiGridObstacle, ObstacleTemplate } from '../types/types';

export default function Home() {
  // Constants
  const BASE_API_URL = '/api';
  const cellSize = 25;
  
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
  const initializeWarehouse = async () => {
    const w = warehouseState.warehouseWidth;
    const h = warehouseState.warehouseHeight;
    
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
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentMode: 'set_start' }));
    updateStatusMessage("Click on the grid to set robot start position.", 'info');
  };
  
  const setEndMode = () => {
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentMode: 'set_end' }));
    updateStatusMessage("Click on the grid to set destination point.", 'info');
  };
  
  const setToggleObstacleMode = () => {
    setWarehouseState((prev: WarehouseState) => ({ ...prev, currentMode: 'toggle_obstacle' }));
    updateStatusMessage("Click on grid cells to place or remove obstacles.", 'info');
  };
  
  const setPlaceMultiGridMode = () => {
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
    
    updateStatusMessage("Simulation reset. Initialize warehouse if needed.", 'info');
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
    updateStatusMessage("System ready. Please initialize warehouse dimensions.", 'info');
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
        onInitializeWarehouse={initializeWarehouse}
        onSetStart={setStartMode}
        onSetEnd={setEndMode}
        onToggleObstacle={setToggleObstacleMode}
        onPlaceMultiGrid={setPlaceMultiGridMode}
        onFindPath={findPath}
        onClearSimulation={clearSimulation}
        onWidthChange={handleWidthChange}
        onHeightChange={handleHeightChange}
        onObstacleTypeChange={handleObstacleTypeChange}
      />
    </div>
  );
}
