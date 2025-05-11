'use client';

import React, { useRef, useEffect } from 'react';
import { WarehouseState, Point, MultiGridObstacle } from '../types/types';

interface WarehouseCanvasProps {
  warehouseState: WarehouseState;
  onCanvasClick: (gridX: number, gridY: number) => void;
}

const WarehouseCanvas: React.FC<WarehouseCanvasProps> = ({
  warehouseState,
  onCanvasClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    warehouseWidth, 
    warehouseHeight, 
    cellSize, 
    obstacles, 
    multiGridObstacles,
    startPoint, 
    endPoint, 
    currentPath, 
    robotPosition 
  } = warehouseState;

  // Colors for drawing
  const colors = {
    gridLines: '#e0e0e0', // Lighter grey for grid lines
    text: '#333333',
    floor: '#f5f5f5', // Light grey floor
    // Obstacle type colors (as fallbacks if images don't load)
    obstacle: { // Default obstacle color if not specified by type
      crate: '#78909c',   // Blue Grey (like a metal crate)
      shelf: '#546e7a',   // Darker Blue Grey (like a shelf unit)
      restricted: '#ef5350', // Muted Red (for restricted zone)
      default: '#607d8b'  // Default if type unknown
    },
    startPoint: '#4CAF50', // Green
    endPoint: '#f44336',   // Red
    path: '#64b5f6',       // Lighter blue for path
    pathHighlight: '#2196f3', // Brighter blue for current segment
    robot: '#ff9800',      // Orange (common for robots/highlight)
    // Status message colors
    status: {
      success: '#28a745',
      error: '#dc3545',
      info: '#007bff' // Can use accent for general info
    }
  };

  // Image refs
  const robotImgRef = useRef<HTMLImageElement | null>(null);
  const obstacleImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const startFlagRef = useRef<HTMLImageElement | null>(null);
  const endFlagRef = useRef<HTMLImageElement | null>(null);
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});

  // Load custom sprites
  useEffect(() => {
    // Load custom sprites
    const loadSprites = async () => {
      const spriteTypes = ['robot', 'box', 'wall', 'human', 'fork', 'item', 'destination'];
      const sprites: Record<string, HTMLImageElement> = {};
      
      for (const type of spriteTypes) {
        const sprite = new Image();
        sprite.src = `/sprites/${type}.png`;
        sprite.onload = () => {
          sprites[type] = sprite;
          // Force canvas redraw when sprite loads
          if (canvasRef.current) {
            drawWarehouse();
          }
        };
      }
      
      spritesRef.current = sprites;
    };
    
    loadSprites();
  }, []);

  // Draw functions
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    if (warehouseWidth === 0 || warehouseHeight === 0) return;
    
    // Draw floor background
    ctx.fillStyle = colors.floor;
    ctx.fillRect(0, 0, warehouseWidth * cellSize, warehouseHeight * cellSize);

    // Draw grid lines
    ctx.strokeStyle = colors.gridLines;
    ctx.lineWidth = 1;

    for (let x = 0; x <= warehouseWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, warehouseHeight * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= warehouseHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(warehouseWidth * cellSize, y * cellSize);
      ctx.stroke();
    }
  };

  const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isObstacle = false) => {
    if (x < 0 || x >= warehouseWidth || y < 0 || y >= warehouseHeight) return;
    ctx.fillStyle = color;
    if (isObstacle) {
      // Slightly inset obstacles for a cleaner look
      ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
    } else {
      ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    }
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    const sprites = spritesRef.current;
    
    // Draw regular single-cell obstacles
    obstacles.forEach(obsDataString => {
      const [xStr, yStr] = obsDataString.split(',');
      const x = parseInt(xStr);
      const y = parseInt(yStr);
      
      // Get obstacle type from multiGridObstacles if this position is part of one
      let obstacleType = 'box'; // Default type
      
      for (const obstacle of multiGridObstacles) {
        if (x >= obstacle.x && x < obstacle.x + obstacle.width &&
            y >= obstacle.y && y < obstacle.y + obstacle.height) {
          obstacleType = obstacle.type;
          break;
        }
      }
      
      // Map the type to the correct sprite
      let spriteKey;
      switch (obstacleType) {
        case 'wall':
          spriteKey = 'wall';
          break;
        case 'crate':
        case 'box':
          spriteKey = 'box';
          break;
        case 'shelf':
        case 'item':
          spriteKey = 'item';
          break;
        case 'restricted':
        case 'human':
          spriteKey = 'human';
          break;
        case 'fork':
          spriteKey = 'fork';
          break;
        default:
          spriteKey = 'box';
      }
      
      // Try to draw the sprite
      const sprite = sprites[spriteKey];
      if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
        ctx.drawImage(
          sprite,
          x * cellSize + 1, // Less padding for larger sprites
          y * cellSize + 1,
          cellSize - 2, // Less padding for larger sprites
          cellSize - 2
        );
      } else {
        // Fallback to color rectangle
        const obstacleColor = colors.obstacle[obstacleType as keyof typeof colors.obstacle] || colors.obstacle.default;
        drawCell(ctx, x, y, obstacleColor, true);
      }
    });

    // Draw multi-grid obstacles
    multiGridObstacles.forEach(obstacle => {
      const { x, y, width, height, type } = obstacle;
      
      // Map the type to the correct sprite
      let spriteKey;
      switch (type) {
        case 'wall':
          spriteKey = 'wall';
          break;
        case 'crate':
        case 'box':
          spriteKey = 'box';
          break;
        case 'shelf':
        case 'item':
          spriteKey = 'item';
          break;
        case 'restricted':
        case 'human':
          spriteKey = 'human';
          break;
        case 'fork':
          spriteKey = 'fork';
          break;
        default:
          spriteKey = 'box';
      }
      
      // Try to draw sprite for each cell of the multi-grid obstacle
      const sprite = spritesRef.current[spriteKey];
      if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
        // Draw the sprite for each cell in the multi-grid obstacle
        for (let i = 0; i < width; i++) {
          for (let j = 0; j < height; j++) {
            // For human multi-grid obstacles, only draw humans at certain positions for realism
            if (spriteKey === 'human') {
              // Only show humans at corners and some middle positions
              if ((i === 0 && j === 0) || 
                  (i === width-1 && j === 0) || 
                  (i === 0 && j === height-1) || 
                  (i === width-1 && j === height-1) ||
                  (i % 2 === 1 && j % 2 === 0)) {
                ctx.drawImage(
                  sprite,
                  (x + i) * cellSize + 1,
                  (y + j) * cellSize + 1,
                  cellSize - 2,
                  cellSize - 2
                );
              } else {
                // Draw floor with a light overlay for human areas
                ctx.fillStyle = 'rgba(255, 230, 230, 0.5)'; // Light red area
                ctx.fillRect(
                  (x + i) * cellSize + 1,
                  (y + j) * cellSize + 1,
                  cellSize - 2,
                  cellSize - 2
                );
              }
            } else {
              // For non-human obstacles, draw sprite in all positions
              ctx.drawImage(
                sprite,
                (x + i) * cellSize + 1,
                (y + j) * cellSize + 1,
                cellSize - 2,
                cellSize - 2
              );
            }
          }
        }
        
        // Add border to show it's a multi-grid obstacle
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';  // Darker border
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x * cellSize,
          y * cellSize,
          width * cellSize,
          height * cellSize
        );
      } else {
        // Fallback to color rectangle
        ctx.fillStyle = colors.obstacle[type as keyof typeof colors.obstacle] || colors.obstacle.default;
        ctx.fillRect(
          x * cellSize + 2,
          y * cellSize + 2,
          width * cellSize - 4,
          height * cellSize - 4
        );
        
        // Add some details/shading to make it look 3D
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x * cellSize + 4,
          y * cellSize + 4,
          width * cellSize - 8,
          height * cellSize - 8
        );
      }
    });
  };

  const drawStartPoint = (ctx: CanvasRenderingContext2D) => {
    if (startPoint) {
      // Try to use the robot sprite for start point
      const robotSprite = spritesRef.current['robot'];
      
      if (robotSprite && robotSprite.complete && robotSprite.naturalHeight !== 0) {
        // Make the start point robot larger
        const startSize = cellSize * 1.1;
        const startX = startPoint.x * cellSize + cellSize/2 - startSize/2;
        const startY = startPoint.y * cellSize + cellSize/2 - startSize/2;
        
        ctx.drawImage(
          robotSprite,
          startX,
          startY,
          startSize,
          startSize
        );
      } else if (startFlagRef.current && startFlagRef.current.complete && startFlagRef.current.naturalHeight !== 0) {
        // Fallback to generated start flag
        ctx.drawImage(
          startFlagRef.current,
          startPoint.x * cellSize + 2,
          startPoint.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4
        );
      } else {
        // Fallback to color
        drawCell(ctx, startPoint.x, startPoint.y, colors.startPoint);
        
        // Draw 'S' text
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${cellSize/2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          'S',
          startPoint.x * cellSize + cellSize/2,
          startPoint.y * cellSize + cellSize/2
        );
      }
    }
  };

  const drawEndPoint = (ctx: CanvasRenderingContext2D) => {
    if (endPoint) {
      // Try to use the destination sprite for end point
      const destinationSprite = spritesRef.current['destination'];
      
      if (destinationSprite && destinationSprite.complete && destinationSprite.naturalHeight !== 0) {
        // Make destination larger
        const destSize = cellSize * 1.1;
        const destX = endPoint.x * cellSize + cellSize/2 - destSize/2;
        const destY = endPoint.y * cellSize + cellSize/2 - destSize/2;
        
        ctx.drawImage(
          destinationSprite,
          destX,
          destY,
          destSize,
          destSize
        );
      } else if (endFlagRef.current && endFlagRef.current.complete && endFlagRef.current.naturalHeight !== 0) {
        // Fallback to generated end flag
        ctx.drawImage(
          endFlagRef.current,
          endPoint.x * cellSize + 2,
          endPoint.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4
        );
      } else {
        // Fallback to color
        drawCell(ctx, endPoint.x, endPoint.y, colors.endPoint);
        
        // Draw 'E' text
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${cellSize/2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          'E',
          endPoint.x * cellSize + cellSize/2,
          endPoint.y * cellSize + cellSize/2
        );
      }
    }
  };

  const drawPath = (ctx: CanvasRenderingContext2D) => {
    if (currentPath.length > 0) {
      // Draw path background
      ctx.strokeStyle = colors.path;
      ctx.lineWidth = Math.max(2, cellSize / 6);
      ctx.beginPath();
      
      currentPath.forEach((p, index) => {
        const centerX = p.x * cellSize + cellSize / 2;
        const centerY = p.y * cellSize + cellSize / 2;
        if (index === 0) {
          ctx.moveTo(centerX, centerY);
        } else {
          ctx.lineTo(centerX, centerY);
        }
      });
      ctx.stroke();
      
      // Draw path dots at each cell center
      currentPath.forEach((p, index) => {
        if (index > 0 && index < currentPath.length - 1) { // Skip start/end points
          const centerX = p.x * cellSize + cellSize / 2;
          const centerY = p.y * cellSize + cellSize / 2;
          
          ctx.fillStyle = colors.pathHighlight;
          ctx.beginPath();
          ctx.arc(centerX, centerY, cellSize / 12, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  };

  const drawRobot = (ctx: CanvasRenderingContext2D) => {
    if (robotPosition) {
      const centerX = robotPosition.x * cellSize + cellSize / 2;
      const centerY = robotPosition.y * cellSize + cellSize / 2;
      
      // Try to use the custom robot sprite
      const robotSprite = spritesRef.current['robot'];
      if (robotSprite && robotSprite.complete && robotSprite.naturalHeight !== 0) {
        // Calculate size based on cell size - make robot larger
        const robotSize = cellSize * 1.2;
        
        // Calculate position to center in cell
        const robotX = centerX - robotSize/2;
        const robotY = centerY - robotSize/2;
        
        ctx.drawImage(robotSprite, robotX, robotY, robotSize, robotSize);
      } else if (robotImgRef.current && robotImgRef.current.complete && robotImgRef.current.naturalHeight !== 0) {
        // Fallback to generated robot image
        const robotSize = cellSize * 1.2;
        const robotX = centerX - robotSize/2;
        const robotY = centerY - robotSize/2;
        
        ctx.drawImage(robotImgRef.current, robotX, robotY, robotSize, robotSize);
      } else {
        // Fallback to circle robot
        const radius = cellSize / 2.5;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = colors.robot;
        ctx.fill();
        
        // Add details to robot
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Add "eyes"
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        
        // Add directional indicator
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.arc(centerX, centerY + radius * 0.2, radius * 0.4, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx.stroke();
      }
    }
  };

  const drawAll = (ctx: CanvasRenderingContext2D) => {
    drawGrid(ctx);
    drawPath(ctx);
    drawObstacles(ctx);
    drawStartPoint(ctx);
    drawEndPoint(ctx);
    drawRobot(ctx);
  };

  // Redraw canvas whenever any of the dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (warehouseWidth > 0 && warehouseHeight > 0) {
      canvas.width = warehouseWidth * cellSize;
      canvas.height = warehouseHeight * cellSize;
      drawAll(ctx);
    }
  }, [warehouseWidth, warehouseHeight, cellSize, obstacles, multiGridObstacles, startPoint, endPoint, currentPath, robotPosition]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || warehouseWidth === 0 || warehouseHeight === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const gridX = Math.floor(clickX / cellSize);
    const gridY = Math.floor(clickY / cellSize);
    
    if (gridX >= 0 && gridX < warehouseWidth && gridY >= 0 && gridY < warehouseHeight) {
      onCanvasClick(gridX, gridY);
    }
  };

  return (
    <div className="flex flex-3 bg-gray-50 justify-center items-center p-5 shadow-inner border-r border-gray-300 relative">
      <canvas 
        ref={canvasRef} 
        id="warehouse-canvas"
        className="bg-white shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl"
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default WarehouseCanvas;
