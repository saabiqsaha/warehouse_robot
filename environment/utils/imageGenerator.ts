'use client';

// Create robot image
export function createRobotImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw a cute robot
  // Background circle
  ctx.fillStyle = '#ff9800'; // Orange
  ctx.beginPath();
  ctx.arc(50, 50, 40, 0, Math.PI * 2);
  ctx.fill();

  // Robot face (white circle)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(50, 50, 30, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(35, 40, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(65, 40, 8, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(50, 55, 15, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // Antenna
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(50, 10);
  ctx.lineTo(50, 25);
  ctx.stroke();
  
  // Antenna top
  ctx.fillStyle = '#ff5722';
  ctx.beginPath();
  ctx.arc(50, 10, 5, 0, Math.PI * 2);
  ctx.fill();

  // Convert to Base64 data URL
  return canvas.toDataURL('image/png');
}

// Create obstacle images
export function createObstacleImages(): Record<string, string> {
  const images: Record<string, string> = {};
  
  // Create crate image
  const crateCanvas = document.createElement('canvas');
  crateCanvas.width = 100;
  crateCanvas.height = 100;
  const crateCtx = crateCanvas.getContext('2d');
  if (crateCtx) {
    // Draw a wooden crate
    crateCtx.fillStyle = '#8D6E63'; // Brown
    crateCtx.fillRect(0, 0, 100, 100);
    
    // Draw the wooden planks
    crateCtx.strokeStyle = '#5D4037'; // Darker brown
    crateCtx.lineWidth = 5;
    
    // Horizontal planks
    for (let y = 20; y < 100; y += 30) {
      crateCtx.beginPath();
      crateCtx.moveTo(0, y);
      crateCtx.lineTo(100, y);
      crateCtx.stroke();
    }
    
    // Vertical planks
    for (let x = 25; x < 100; x += 25) {
      crateCtx.beginPath();
      crateCtx.moveTo(x, 0);
      crateCtx.lineTo(x, 100);
      crateCtx.stroke();
    }
    
    // Add some nails/metal parts
    crateCtx.fillStyle = '#9E9E9E'; // Grey
    for (let x = 25; x < 100; x += 25) {
      for (let y = 20; y < 100; y += 30) {
        crateCtx.beginPath();
        crateCtx.arc(x, y, 3, 0, Math.PI * 2);
        crateCtx.fill();
      }
    }
    
    images.crate = crateCanvas.toDataURL('image/png');
  }
  
  // Create shelf image
  const shelfCanvas = document.createElement('canvas');
  shelfCanvas.width = 100;
  shelfCanvas.height = 100;
  const shelfCtx = shelfCanvas.getContext('2d');
  if (shelfCtx) {
    // Draw a shelf
    shelfCtx.fillStyle = '#546E7A'; // Blue-grey
    shelfCtx.fillRect(0, 0, 100, 100);
    
    // Draw shelves
    shelfCtx.fillStyle = '#455A64'; // Darker blue-grey
    for (let y = 20; y < 100; y += 25) {
      shelfCtx.fillRect(0, y, 100, 5);
    }
    
    // Draw some items on the shelves
    for (let y = 25; y < 100; y += 25) {
      // Random boxes
      for (let i = 0; i < 3; i++) {
        const x = 10 + i * 30;
        const width = 20;
        const height = 15;
        
        shelfCtx.fillStyle = ['#FFC107', '#4CAF50', '#2196F3'][i % 3]; // Yellow, green, blue
        shelfCtx.fillRect(x, y - height, width, height);
        
        // Box outline
        shelfCtx.strokeStyle = '#333';
        shelfCtx.lineWidth = 1;
        shelfCtx.strokeRect(x, y - height, width, height);
      }
    }
    
    images.shelf = shelfCanvas.toDataURL('image/png');
  }
  
  // Create restricted area image
  const restrictedCanvas = document.createElement('canvas');
  restrictedCanvas.width = 100;
  restrictedCanvas.height = 100;
  const restrictedCtx = restrictedCanvas.getContext('2d');
  if (restrictedCtx) {
    // Draw restricted area (striped background)
    restrictedCtx.fillStyle = '#F44336'; // Red
    restrictedCtx.fillRect(0, 0, 100, 100);
    
    // Draw diagonal stripes
    restrictedCtx.fillStyle = '#B71C1C'; // Darker red
    const stripeWidth = 10;
    const stripeSpacing = 20;
    
    for (let i = -100; i < 200; i += stripeSpacing) {
      restrictedCtx.beginPath();
      restrictedCtx.moveTo(i, 0);
      restrictedCtx.lineTo(i + 100, 100);
      restrictedCtx.lineTo(i + 100 + stripeWidth, 100);
      restrictedCtx.lineTo(i + stripeWidth, 0);
      restrictedCtx.closePath();
      restrictedCtx.fill();
    }
    
    // Draw warning symbol
    restrictedCtx.fillStyle = '#FFEB3B'; // Yellow
    restrictedCtx.beginPath();
    restrictedCtx.moveTo(50, 20);
    restrictedCtx.lineTo(80, 75);
    restrictedCtx.lineTo(20, 75);
    restrictedCtx.closePath();
    restrictedCtx.fill();
    
    // Draw outline
    restrictedCtx.strokeStyle = '#000';
    restrictedCtx.lineWidth = 3;
    restrictedCtx.beginPath();
    restrictedCtx.moveTo(50, 20);
    restrictedCtx.lineTo(80, 75);
    restrictedCtx.lineTo(20, 75);
    restrictedCtx.closePath();
    restrictedCtx.stroke();
    
    // Draw exclamation mark
    restrictedCtx.fillStyle = '#000';
    restrictedCtx.beginPath();
    restrictedCtx.arc(50, 65, 4, 0, Math.PI * 2);
    restrictedCtx.fill();
    restrictedCtx.fillRect(46, 40, 8, 20);
    
    images.restricted = restrictedCanvas.toDataURL('image/png');
  }
  
  return images;
}

// Create flag images
export function createFlagImages(): { start: string; end: string } {
  const flags = { start: '', end: '' };
  
  // Create start flag
  const startCanvas = document.createElement('canvas');
  startCanvas.width = 100;
  startCanvas.height = 100;
  const startCtx = startCanvas.getContext('2d');
  if (startCtx) {
    // Draw flag pole
    startCtx.fillStyle = '#795548'; // Brown
    startCtx.fillRect(40, 20, 5, 70);
    
    // Draw flag
    startCtx.fillStyle = '#4CAF50'; // Green
    startCtx.beginPath();
    startCtx.moveTo(45, 20);
    startCtx.lineTo(80, 30);
    startCtx.lineTo(45, 40);
    startCtx.closePath();
    startCtx.fill();
    
    // Draw base
    startCtx.fillStyle = '#5D4037'; // Darker brown
    startCtx.beginPath();
    startCtx.ellipse(42, 90, 15, 8, 0, 0, Math.PI * 2);
    startCtx.fill();
    
    // Draw letter S
    startCtx.fillStyle = '#fff';
    startCtx.font = 'bold 20px Arial';
    startCtx.textAlign = 'center';
    startCtx.fillText('S', 62, 32);
    
    flags.start = startCanvas.toDataURL('image/png');
  }
  
  // Create end flag
  const endCanvas = document.createElement('canvas');
  endCanvas.width = 100;
  endCanvas.height = 100;
  const endCtx = endCanvas.getContext('2d');
  if (endCtx) {
    // Draw flag pole
    endCtx.fillStyle = '#795548'; // Brown
    endCtx.fillRect(40, 20, 5, 70);
    
    // Draw flag
    endCtx.fillStyle = '#F44336'; // Red
    endCtx.beginPath();
    endCtx.moveTo(45, 20);
    endCtx.lineTo(80, 30);
    endCtx.lineTo(45, 40);
    endCtx.closePath();
    endCtx.fill();
    
    // Draw checkerboard pattern
    endCtx.fillStyle = '#fff';
    const squareSize = 7;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 2 === 0) {
          endCtx.fillRect(45 + i * squareSize, 20 + j * squareSize, squareSize, squareSize);
        }
      }
    }
    
    // Draw base
    endCtx.fillStyle = '#5D4037'; // Darker brown
    endCtx.beginPath();
    endCtx.ellipse(42, 90, 15, 8, 0, 0, Math.PI * 2);
    endCtx.fill();
    
    // Draw letter E
    endCtx.fillStyle = '#fff';
    endCtx.font = 'bold 20px Arial';
    endCtx.textAlign = 'center';
    endCtx.fillText('E', 62, 32);
    
    flags.end = endCanvas.toDataURL('image/png');
  }
  
  return flags;
}
