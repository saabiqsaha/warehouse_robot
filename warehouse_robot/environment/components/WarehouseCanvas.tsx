'use client';

import React, { useRef, useEffect } from 'react';
import { WarehouseState } from '../types/types';

interface WarehouseCanvasProps {
  warehouseState: WarehouseState;
  cellSize: number;
  colors: any;
  robotImg: HTMLImageElement;
  obstacleImages: Record<string, HTMLImageElement>;
  startFlag: HTMLImageElement;
  endFlag: HTMLImageElement;
}

const WarehouseCanvas: React.FC<WarehouseCanvasProps> = ({
  warehouseState,
  cellSize,
  colors,
  robotImg,
  obstacleImages,
  startFlag,
  endFlag
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    warehouseWidth, 
    warehouseHeight, 
    obstacles, 
    multiGridObstacles,
    startPoint, 
    endPoint, 
    currentPath, 
    robotPosition 
  } = warehouseState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    if (warehouseWidth > 0 && warehouseHeight > 0) {
      canvas.width = warehouseWidth * cellSize;
      canvas.height = warehouseHeight * cellSize;
      
      // Draw everything
      drawAll(ctx);
    }
  }, [
    warehouseState, 
    cellSize, 
    colors, 
    robotImg, 
    obstacleImages, 
    startFlag, 
    endFlag
  ]);

  const drawAll = (ctx: CanvasRenderingContext2D) => {
    drawGrid(ctx);
    drawPath(ctx);
    drawObstacles(ctx);
    drawStartPoint(ctx);
    drawEndPoint(ctx);
    drawRobot(ctx);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
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
      ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
    } else {
      ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    }
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    // Draw regular single-cell obstacles
    Array.from(obstacles).forEach(obsDataString => {
      const [xStr, yStr] = obsDataString.split(',');
      const x = parseInt(xStr);
      const y = parseInt(yStr);
      
      const currentSelectedType = 'crate'; // Default type for existing obstacles
      
      // Try to draw image
      const img = obstacleImages[currentSelectedType];
      if (img && img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(
          img,
          x * cellSize + 2,
          y * cellSize + 2,
          cellSize - 4,
          cellSize - 4
        );
      } else {
        // Fallback to color rectangle
        const obstacleColor = colors.obstacle[currentSelectedType] || colors.obstacle.default;
        drawCell(ctx, x, y, obstacleColor, true);
      }
    });

    // Draw multi-grid obstacles
    multiGridObstacles.forEach(obstacle => {
      const { x, y, width, height, type } = obstacle;
      
      // Draw a combined rectangle for the multi-grid obstacle
      ctx.fillStyle = colors.obstacle[type] || colors.obstacle.default;
      ctx.fillRect(
        x * cellSize + 2,
        y * cellSize + 2,
        width * cellSize - 4,
        height * cellSize - 4
      );
      
      // Try to draw image with proper stretching
      const img = obstacleImages[type];
      if (img && img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(
          img,
          x * cellSize + 4,
          y * cellSize + 4,
          width * cellSize - 8,
          height * cellSize - 8
        );
      }
      
      // Add some details/shading to make it look 3D
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        x * cellSize + 4,
        y * cellSize + 4,
        width * cellSize - 8,
        height * cellSize - 8
      );
      
      // Add text label
      ctx.fillStyle = '#fff';
      ctx.font = `${cellSize/3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let label = '';
      switch(type) {
        case 'shelf':
          label = width > 1 ? 'Shelf Unit' : 'Shelf';
          break;
        case 'crate':
          label = width > 1 ? 'Crates' : 'Crate';
          break;
        case 'restricted':
          label = 'Restricted';
          break;
        default:
          label = 'Obstacle';
      }
      
      ctx.fillText(
        label,
        (x + width/2) * cellSize,
        (y + height/2) * cellSize
      );
    });
  };

  const drawStartPoint = (ctx: CanvasRenderingContext2D) => {
    if (startPoint) {
      if (startFlag.complete && startFlag.naturalHeight !== 0) {
        ctx.drawImage(
          startFlag,
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
      if (endFlag.complete && endFlag.naturalHeight !== 0) {
        ctx.drawImage(
          endFlag,
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
    if (currentPath && currentPath.length > 0) {
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
      
      if (robotImg.complete && robotImg.naturalHeight !== 0) {
        // Calculate size based on cell size
        const robotSize = cellSize * 0.8;
        
        // Calculate position to center in cell
        const robotX = centerX - robotSize/2;
        const robotY = centerY - robotSize/2;
        
        ctx.drawImage(robotImg, robotX, robotY, robotSize, robotSize);
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

  return (
    <canvas 
      ref={canvasRef} 
      id="warehouse-canvas" 
      className="bg-white shadow-lg rounded-lg transition-all hover:shadow-xl"
    />
  );
};

export default WarehouseCanvas; 