'use client';

import React, { useRef, useEffect, useState } from 'react';
import { WarehouseState, Point, MultiGridObstacle } from '../types/types';

interface WarehouseCanvasProps {
  warehouseState: WarehouseState;
  onCanvasClick: (gridX: number, gridY: number) => void;
}

// Define paths for our sprites
const SPRITE_PATHS: Record<string, string> = {
  robot: '/sprites/robot.png',
  destination: '/sprites/destination.png',
  box: '/sprites/box.png',
  human: '/sprites/human.png',
  wall: '/sprites/wall.png',
  // Add other types if they have dedicated sprites (e.g., shelf, crate)
  // If not, they will use the fallback color drawing.
  // For preset obstacles like 'shelf' or 'restricted' that were assigned '/sprites/wall.png',
  // that mapping happens in page.tsx's PREDEFINED_ENVIRONMENTS.
  // Here, we only care about the actual sprite files.
};

const WarehouseCanvas: React.FC<WarehouseCanvasProps> = ({
  warehouseState,
  onCanvasClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    warehouseWidth, 
    warehouseHeight, 
    cellSize, 
    // obstacles, // This Set<string> might become less relevant if MultiGridObstacles cover all.
    multiGridObstacles,
    startPoint, 
    endPoint, 
    currentPath, 
    robotPosition 
  } = warehouseState;

  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Colors for drawing (kept for fallbacks and other elements)
  const colors = {
    gridLines: '#e0e0e0',
    text: '#333333',
    floor: '#f5f5f5',
    obstacle: { 
      crate: '#78909c',
      shelf: '#546e7a',
      restricted: '#ef5350',
      default: '#607d8b',
      // Add our new types for color fallbacks if sprites fail or are not defined for a type
      box: '#a1887f', // Brown for box
      human: '#ffb74d', // Orange for human
      wall: '#bdbdbd',  // Grey for wall
    },
    startPoint: '#4CAF50', // Kept for potential fallback if robot sprite fails at start
    endPoint: '#f44336',   // Kept for potential fallback if destination sprite fails
    path: '#64b5f6',
    pathHighlight: '#2196f3',
    robot: '#ff9800',      // Fallback robot color
    status: {
      success: '#28a745',
      error: '#dc3545',
      info: '#007bff'
    }
  };

  // Load images
  useEffect(() => {
    const images: Record<string, HTMLImageElement> = {};
    const spriteKeys = Object.keys(SPRITE_PATHS);
    let imagesToLoadCount = spriteKeys.length;

    if (imagesToLoadCount === 0) {
      setImagesLoaded(true);
      return;
    }

    const onImageLoadOrError = () => {
      imagesToLoadCount--;
      if (imagesToLoadCount === 0) {
        setLoadedImages(images);
        setImagesLoaded(true);
        // Force a redraw if canvas is already initialized
        // This ensures that if images load after the initial paint, the canvas updates.
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx && warehouseWidth > 0 && warehouseHeight > 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // It is generally better to rely on the main redraw useEffect triggered by imagesLoaded state change.
                // However, explicitly calling drawAll here can make the update appear faster in some scenarios.
                // Make sure drawAll is defined/hoisted if called here.
                 const tempDrawAll = (context: CanvasRenderingContext2D) => { // Temporarily define for this scope if needed
                    drawGrid(context);
                    drawPath(context);
                    drawObstacles(context);
                    drawStartPoint(context);
                    drawEndPoint(context);
                    drawRobot(context);
                };
                tempDrawAll(ctx);
            }
        }
      }
    };

    spriteKeys.forEach(key => {
      images[key] = new Image();
      images[key].onload = onImageLoadOrError;
      images[key].onerror = () => {
        console.error(`Failed to load sprite: ${SPRITE_PATHS[key]}`);
        onImageLoadOrError(); // Decrement count even on error
      };
      images[key].src = SPRITE_PATHS[key];
    });
  // drawAll dependency will be handled by the main redraw useEffect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Changed dependency array to [] for mount-only image loading


  // Draw functions
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    if (warehouseWidth === 0 || warehouseHeight === 0) return;
    
    ctx.fillStyle = colors.floor;
    ctx.fillRect(0, 0, warehouseWidth * cellSize, warehouseHeight * cellSize);

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

  const drawCellFallback = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    if (x < 0 || x >= warehouseWidth || y < 0 || y >= warehouseHeight) return;
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
  };
  
  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    multiGridObstacles.forEach(obstacle => {
      const { x, y, width, height, type, sprite } = obstacle;
      let drawnWithSprite = false;
      let spriteUsedKey: string | undefined = undefined;

      if (sprite) {
        const spriteKey = Object.keys(SPRITE_PATHS).find(key => SPRITE_PATHS[key] === sprite);
        if (spriteKey) {
            spriteUsedKey = spriteKey;
            const img = loadedImages[spriteKey];
            if (img && img.complete && img.naturalHeight !== 0) {
            try {
                ctx.drawImage(
                img,
                x * cellSize,
                y * cellSize,
                width * cellSize,
                height * cellSize
                );
                drawnWithSprite = true;
            } catch (e) {
                console.error("Error drawing image:", sprite, e);
            }
            }
        }
      }

      if (!drawnWithSprite) {
        const obstacleColor = colors.obstacle[type as keyof typeof colors.obstacle] || colors.obstacle.default;
        ctx.fillStyle = obstacleColor;
        ctx.fillRect(
          x * cellSize + 1,
          y * cellSize + 1,
          width * cellSize - 2,
          height * cellSize - 2
        );
      }

      // Always draw label, adjust color based on if sprite was drawn
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelX = (x + width / 2) * cellSize;
      const labelY = (y + height / 2) * cellSize;
      
      let label = type.charAt(0).toUpperCase() + type.slice(1);
      const fontSize = Math.min(Math.max(width * cellSize / label.length, height * cellSize / 3), cellSize / 2.5, 12 ); // Dynamic font size
      ctx.font = `bold ${fontSize}px Arial`;

      if (drawnWithSprite && (spriteUsedKey === 'wall' || spriteUsedKey === 'shelf' || spriteUsedKey === 'restricted')) {
        // For dark sprites like walls/shelves, use light text
        ctx.fillStyle = '#FFFFFF'; // White text
        // Optionally add a slight shadow or outline for better readability on complex sprites
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.5;
        ctx.strokeText(label, labelX, labelY);
      } else if (drawnWithSprite) {
        ctx.fillStyle = '#000000'; // Black text for lighter sprites (box, human)
      } else {
        ctx.fillStyle = '#FFFFFF'; // White text for colored fallback blocks
      }
      ctx.fillText(label, labelX, labelY);
    });
  };

  const drawStartPoint = (ctx: CanvasRenderingContext2D) => {
    // Start point is primarily indicated by the robot's initial position.
    // If a distinct visual marker for the start cell itself is needed (even when robot moves),
    // it could be drawn here. For now, robot drawing handles the initial state.
    if (startPoint) {
        // Optionally, draw a subtle marker if robot is not at startPoint but path planning has occurred.
        // For simplicity, if robot is at startPoint, its sprite is enough.
        // If we want a permanent 'S' or different flag even when robot moves away:
        // const robotIsAtStart = robotPosition && robotPosition.x === startPoint.x && robotPosition.y === startPoint.y;
        // if (!robotIsAtStart) { ... draw a static start marker ... }
    }
  };

  const drawEndPoint = (ctx: CanvasRenderingContext2D) => {
    if (endPoint) {
      const img = loadedImages['destination'];
      if (img && img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(
          img,
          endPoint.x * cellSize,
          endPoint.y * cellSize,
          cellSize,
          cellSize
        );
        // Add label to destination sprite
        ctx.fillStyle = '#FFFFFF'; // White text
        ctx.font = `bold ${cellSize / 3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; // Position below the center of the sprite
        ctx.fillText('End', endPoint.x * cellSize + cellSize / 2, endPoint.y * cellSize + cellSize - 2);

      } else {
        // Fallback to color and text
        drawCellFallback(ctx, endPoint.x, endPoint.y, colors.endPoint);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${cellSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', endPoint.x * cellSize + cellSize / 2, endPoint.y * cellSize + cellSize / 2);
      }
    }
  };

  const drawPath = (ctx: CanvasRenderingContext2D) => {
    if (currentPath.length > 0) {
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
      
      currentPath.forEach((p, index) => {
        if (index > 0 && index < currentPath.length - 1) {
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
      const img = loadedImages['robot'];
      if (img && img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(
          img,
          robotPosition.x * cellSize,
          robotPosition.y * cellSize,
          cellSize,
          cellSize
        );
        // Optionally add a label to the robot, e.g., its coordinates or just "Robot"
        // ctx.fillStyle = '#000000';
        // ctx.font = `bold ${cellSize / 4}px Arial`;
        // ctx.textAlign = 'center';
        // ctx.textBaseline = 'top';
        // ctx.fillText(`R`, robotPosition.x * cellSize + cellSize / 2, robotPosition.y * cellSize + cellSize + 2);

      } else {
        // Fallback to circle robot
        const centerX = robotPosition.x * cellSize + cellSize / 2;
        const centerY = robotPosition.y * cellSize + cellSize / 2;
        const radius = cellSize / 2.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = colors.robot;
        ctx.fill();
        // Simple 'R' for fallback
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${cellSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R', centerX, centerY);
      }
    }
  };

  // Define drawAll here or ensure it's hoisted/available for the image loading useEffect
  const drawAll = (ctx: CanvasRenderingContext2D) => {
    drawGrid(ctx);
    drawPath(ctx);
    drawObstacles(ctx); // Should be drawn before robot/destination if they can overlap
    drawStartPoint(ctx); // Mostly for semantic clarity, actual rendering is robot at start
    drawEndPoint(ctx);
    drawRobot(ctx);
  };
  
  // Main redraw effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return; // Don't draw until images are processed
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (warehouseWidth > 0 && warehouseHeight > 0) {
      canvas.width = warehouseWidth * cellSize;
      canvas.height = warehouseHeight * cellSize;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear before drawing
      drawAll(ctx);
    }
  // Key state variables that should trigger a redraw
  }, [
      warehouseWidth, warehouseHeight, cellSize, 
      multiGridObstacles, startPoint, endPoint, currentPath, robotPosition, 
      loadedImages, imagesLoaded, // Redraw when images are loaded
      // drawAll // if drawAll is memoized with useCallback, add it here
  ]);


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
      {!imagesLoaded && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'black', background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '5px' }}>
          Loading sprites...
        </div>
      )}
    </div>
  );
};

export default WarehouseCanvas;
