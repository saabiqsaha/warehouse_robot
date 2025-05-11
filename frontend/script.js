document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const canvas = document.getElementById('warehouse-canvas');
    const ctx = canvas.getContext('2d');
    const widthInput = document.getElementById('warehouse-width');
    const heightInput = document.getElementById('warehouse-height');
    const initWarehouseBtn = document.getElementById('init-warehouse-btn');
    const setStartBtn = document.getElementById('set-start-btn');
    const setEndBtn = document.getElementById('set-end-btn');
    const toggleObstacleBtn = document.getElementById('toggle-obstacle-btn');
    const findPathBtn = document.getElementById('find-path-btn');
    const clearSimulationBtn = document.getElementById('clear-simulation-btn');
    const currentModeTextEl = document.getElementById('current-mode-text');
    
    // State variables
    let warehouseWidth = 0;
    let warehouseHeight = 0;
    let cellSize = 25; // Consider making this dynamic or theme-adjustable later
    let obstacles = new Set();
    let multiGridObstacles = []; // New array to store multi-grid obstacles
    let startPoint = null;
    let endPoint = null;
    let currentPath = [];
    let robotPosition = null;
    let currentMode = 'none';
    let animationInProgress = false;
    let animationSpeed = 300; // milliseconds between steps
    let animationFrame = null;
    const BASE_API_URL = '/api'; // Updated to use relative URL for API endpoints

    // Preload images
    const robotImg = new Image();
    robotImg.src = 'images/robot.png'; // This will be created later
    
    const obstacleImages = {
        crate: new Image(),
        shelf: new Image(),
        restricted: new Image()
    };
    
    obstacleImages.crate.src = 'images/crate.png';
    obstacleImages.shelf.src = 'images/shelf.png';
    obstacleImages.restricted.src = 'images/restricted.png';
    
    const startFlag = new Image();
    startFlag.src = 'images/start_flag.png';
    
    const endFlag = new Image();
    endFlag.src = 'images/end_flag.png';
    
    // Multi-grid obstacle definitions
    const obstacleTemplates = {
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

    // Updated Theme Colors for Canvas Drawing
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
    
    const obstacleTypeSelect = document.getElementById('obstacle-type'); // Make sure this is selected if not already

    // --- Drawing Functions (Update colors here) ---
    function drawGrid() {
        if (warehouseWidth === 0 || warehouseHeight === 0) return;

        // Dynamically adjust cell size if canvas is too big for the pane
        const simPane = document.querySelector('.simulation-pane');
        const maxCanvasWidth = simPane.clientWidth - 40; // 20px padding on each side
        const maxCanvasHeight = simPane.clientHeight - 40;
        
        let proposedCellSizeWidth = Math.floor(maxCanvasWidth / warehouseWidth);
        let proposedCellSizeHeight = Math.floor(maxCanvasHeight / warehouseHeight);
        cellSize = Math.min(proposedCellSizeWidth, proposedCellSizeHeight, 35); // Cap max cell size too
        if (cellSize < 5) cellSize = 5; // Minimum cell size

        canvas.width = warehouseWidth * cellSize;
        canvas.height = warehouseHeight * cellSize;
        
        // Draw floor background
        ctx.fillStyle = colors.floor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = colors.gridLines;
        ctx.lineWidth = 1; // Thinner grid lines might look cleaner

        for (let x = 0; x <= warehouseWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= warehouseHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(canvas.width, y * cellSize);
            ctx.stroke();
        }
    }

    function drawCell(x, y, color, isObstacle = false) {
        if (x < 0 || x >= warehouseWidth || y < 0 || y >= warehouseHeight) return;
        ctx.fillStyle = color;
        if (isObstacle) {
            // Slightly inset obstacles for a cleaner look
            ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
        } else {
            ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
        }
    }

    function drawObstacles() {
        // Draw regular single-cell obstacles
        obstacles.forEach(obsDataString => {
            const [xStr, yStr] = obsDataString.split(',');
            const x = parseInt(xStr);
            const y = parseInt(yStr);
            
            const currentSelectedType = obstacleTypeSelect.value;
            
            // Try to draw image first
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
                drawCell(x, y, obstacleColor, true);
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
    }

    function drawStartPoint() {
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
                drawCell(startPoint.x, startPoint.y, colors.startPoint);
                
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
    }

    function drawEndPoint() {
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
                drawCell(endPoint.x, endPoint.y, colors.endPoint);
                
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
    }

    function drawPath() {
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
    }
    
    function drawRobot() {
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
    }

    function redrawAll() {
        drawGrid(); // This now also resizes canvas based on available space
        drawPath(); 
        drawObstacles();
        drawStartPoint();
        drawEndPoint();
        drawRobot();
    }
    
    function updateStatusMessage(message, type = 'info') { // type can be 'info', 'success', 'error'
        const logContainer = document.getElementById('status-message-log');
        const newMessage = document.createElement('p');
        
        let color;
        let prefix = "&gt; ";
        switch(type) {
            case 'success':
                color = colors.status.success;
                prefix = "[OK] ";
                break;
            case 'error':
                color = colors.status.error;
                prefix = "[FAIL] ";
                break;
            case 'info':
            default:
                color = colors.status.info; // Or a neutral log color like colors.text
                prefix = "[INFO] ";
                break;
        }
        newMessage.innerHTML = prefix + message; // Using innerHTML for prefix
        newMessage.style.color = color;
        
        // Prepend new messages
        if (logContainer.firstChild && logContainer.firstChild.textContent.includes("System awaiting initialization...")) {
            logContainer.innerHTML = ''; // Clear initial message
        }
        logContainer.prepend(newMessage);

        // Limit number of log messages (optional)
        const maxLogMessages = 20;
        while (logContainer.children.length > maxLogMessages) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    function updateModeText() {
        let modeDescription = "Standby";
        if (currentMode === 'set_start') modeDescription = "Set Robot Start Point (Click on Grid)";
        else if (currentMode === 'set_end') modeDescription = "Set Destination Point (Click on Grid)";
        else if (currentMode === 'toggle_obstacle') {
            const selectedObstacle = obstacleTypeSelect.options[obstacleTypeSelect.selectedIndex].text;
            modeDescription = `Place/Remove ${selectedObstacle} (Click on Grid)`;
        }
        else if (currentMode === 'place_multi_grid') {
            const selectedObstacle = obstacleTypeSelect.options[obstacleTypeSelect.selectedIndex].text;
            modeDescription = `Place Multi-Grid ${selectedObstacle} (Click on Grid)`;
        }
        currentModeTextEl.textContent = `Current Mode: ${modeDescription}`;
    }

    // Animation functions for robot movement
    function animateRobot() {
        if (!robotPosition || currentPath.length <= 1 || !startPoint) {
            animationInProgress = false;
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
            animationInProgress = false;
            updateStatusMessage("Robot reached the destination!", 'success');
            return;
        }

        // Move to the next point in the path
        const nextPosition = currentPath[currentIndex + 1];
        robotPosition = { ...nextPosition };
        
        // Redraw the scene
        redrawAll();
        
        // Schedule the next animation frame
        animationFrame = setTimeout(animateRobot, animationSpeed);
    }

    function startRobotAnimation() {
        if (animationInProgress) return;
        
        if (!currentPath.length || !startPoint) {
            updateStatusMessage("No path available for robot to follow.", 'error');
            return;
        }
        
        // Set robot at start position
        robotPosition = { ...startPoint };
        animationInProgress = true;
        
        // Clear any existing animation
        if (animationFrame) {
            clearTimeout(animationFrame);
        }
        
        // Start animation
        updateStatusMessage("Robot is moving to destination...", 'info');
        animationFrame = setTimeout(animateRobot, animationSpeed);
    }

    // --- Event Listeners ---
    // The initWarehouseBtn click listener should call redrawAll() AFTER backend confirmation.
    initWarehouseBtn.addEventListener('click', async () => {
        const w = parseInt(widthInput.value);
        const h = parseInt(heightInput.value);

        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            updateStatusMessage("Valid positive integers required for width and height.", 'error');
            return;
        }
        
        updateStatusMessage(`Initializing warehouse: ${w}x${h}...`, 'info');
        
        try {
            // This is where you'd call the backend API
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

            warehouseWidth = data.width;
            warehouseHeight = data.height;
            obstacles.clear(); // Clear local obstacles
            // data.obstacles should be an empty list from backend after init
            data.obstacles.forEach(obs => obstacles.add(`${obs[0]},${obs[1]}`)); // Update to handle tuple format
            
            startPoint = null;
            endPoint = null;
            currentPath = [];
            robotPosition = null;
            currentMode = 'none';
            updateModeText();
            redrawAll(); // This will now use dynamic cell sizing
            updateStatusMessage(data.message || `Warehouse ${w}x${h} initialized.`, 'success');

        } catch (error) {
            console.error("Error initializing warehouse:", error);
            updateStatusMessage(`Initialization failed: ${error.message}`, 'error');
            // Don't update local state if backend failed
        }
    });
    
    // Ensure obstacleTypeSelect change updates mode text if in obstacle mode
    obstacleTypeSelect.addEventListener('change', () => {
        if (currentMode === 'toggle_obstacle') {
            updateModeText();
        }
    });

    // Modify canvas click handler to potentially store obstacle type
    canvas.addEventListener('click', async (event) => { // Made async for potential backend calls
        if (warehouseWidth === 0 || warehouseHeight === 0) {
            updateStatusMessage("Please initialize the warehouse first.", 'error');
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const gridX = Math.floor(clickX / cellSize);
        const gridY = Math.floor(clickY / cellSize);

        if (gridX < 0 || gridX >= warehouseWidth || gridY < 0 || gridY >= warehouseHeight) {
            return; 
        }

        let successMessage = "";
        let needsRedraw = false;

        if (currentMode === 'set_start') {
            // Check against local obstacles Set
             if (obstacles.has(`${gridX},${gridY}`)) { // Assuming obstacles still stores "x,y" strings
                updateStatusMessage("Cannot set start point on an obstacle.", 'error');
                return;
            }
            startPoint = { x: gridX, y: gridY };
            robotPosition = { ...startPoint };
            successMessage = `Start point set at (${gridX},${gridY}).`;
            currentMode = 'none';
            needsRedraw = true;
        } else if (currentMode === 'set_end') {
            if (obstacles.has(`${gridX},${gridY}`)) {
                updateStatusMessage("Cannot set end point on an obstacle.", 'error');
                return;
            }
            if (startPoint && startPoint.x === gridX && startPoint.y === gridY) {
                updateStatusMessage("End point cannot be the same as the start point.", 'error');
                return;
            }
            endPoint = { x: gridX, y: gridY };
            successMessage = `End point set at (${gridX},${gridY}).`;
            currentMode = 'none';
            needsRedraw = true;
        } else if (currentMode === 'toggle_obstacle') {
            if (startPoint && startPoint.x === gridX && startPoint.y === gridY) {
                updateStatusMessage("Cannot place obstacle on start point.", 'error');
                return;
            }
            if (endPoint && endPoint.x === gridX && endPoint.y === gridY) {
                updateStatusMessage("Cannot place obstacle on end point.", 'error');
                return;
            }
            
            const obsKey = `${gridX},${gridY}`;
            const selectedType = obstacleTypeSelect.value; // We'll use this when sending to backend

            // For now, local obstacles set still uses "x,y" keys
            // Backend interaction for add/remove obstacle needs to be implemented
            let action;
            if (obstacles.has(obsKey)) {
                action = 'DELETE';
            } else {
                action = 'POST';
            }

            try {
                const response = await fetch(`${BASE_API_URL}/obstacle`, {
                    method: action,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ x: gridX, y: gridY /*, type: selectedType */ }) // Send type if backend supports
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                
                // Update local obstacles from backend response
                obstacles.clear();
                data.obstacles.forEach(obs => {
                    // Backend returns list of [x,y] tuples
                    obstacles.add(`${obs[0]},${obs[1]}`);
                });

                successMessage = data.message;
                needsRedraw = true;

            } catch (error) {
                console.error(`Error ${action === 'POST' ? 'adding' : 'removing'} obstacle:`, error);
                updateStatusMessage(`Failed: ${error.message}`, 'error');
                return; // Don't redraw if backend failed
            }

        } else if (currentMode === 'place_multi_grid') {
            // Handle placing multi-grid obstacles
            const selectedType = obstacleTypeSelect.value;
            
            // Determine which template to use based on the selected type
            let template;
            if (selectedType === 'shelf') {
                // Randomly choose between small and large shelf
                template = Math.random() > 0.5 ? obstacleTemplates.small_shelf : obstacleTemplates.large_shelf;
            } else if (selectedType === 'crate') {
                // Randomly choose between single crate and crate stack
                template = Math.random() > 0.3 ? obstacleTemplates.crate_stack : obstacleTemplates.small_crate;
            } else if (selectedType === 'restricted') {
                template = obstacleTemplates.restricted_area;
            } else {
                template = obstacleTemplates.small_crate; // Default
            }
            
            // Check if we can place this multi-grid obstacle
            if (isValidForMultiGridObstacle(gridX, gridY, template.width, template.height)) {
                // Add the multi-grid obstacle
                multiGridObstacles.push({
                    x: gridX,
                    y: gridY,
                    width: template.width,
                    height: template.height,
                    type: selectedType
                });
                
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
                
                successMessage = `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} placed at (${gridX},${gridY}).`;
                currentMode = 'none';
                needsRedraw = true;
            } else {
                updateStatusMessage("Cannot place obstacle in this location. Space is occupied or out of bounds.", 'error');
            }
        } else {
             updateStatusMessage("Select a mode (Set Start, Set End, Place Obstacles) to interact with the grid.", 'info');
        }
        
        if (needsRedraw) {
            redrawAll();
            if (successMessage) updateStatusMessage(successMessage, 'success');
            updateModeText(); // Reset mode text if mode changed
        }
    });
    
    // Update findPathBtn to use the animation function
    findPathBtn.addEventListener('click', async () => {
        if (!startPoint || !endPoint) {
            updateStatusMessage("Please set both start and end points before finding a path.", 'error');
            return;
        }
        if (warehouseWidth === 0) {
            updateStatusMessage("Please initialize the warehouse first.", 'error');
            return;
        }

        // Stop any existing animation
        if (animationInProgress) {
            clearTimeout(animationFrame);
            animationInProgress = false;
        }

        updateStatusMessage("Calculating route...", 'info');
        currentPath = []; // Clear previous path before new calculation

        try {
            const response = await fetch(`${BASE_API_URL}/plan_path`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: { x: startPoint.x, y: startPoint.y },
                    end: { x: endPoint.x, y: endPoint.y }
                    // Obstacles are on the backend, so no need to send from here
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.path && data.path.length > 0) {
                currentPath = data.path; 
                updateStatusMessage(`Path found with ${currentPath.length} steps. Starting robot...`, 'success');
                
                // Start the robot animation
                startRobotAnimation();
            } else {
                currentPath = [];
                updateStatusMessage(data.message || "No path could be found.", 'info');
            }
        } catch (error) {
            console.error('Error finding path:', error);
            updateStatusMessage(`Pathfinding error: ${error.message}`, 'error');
            currentPath = [];
        }
        redrawAll(); // Redraw to show new path or lack thereof
    });

    // Add function for placing multi-grid obstacles
    function isValidForMultiGridObstacle(x, y, width, height) {
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
    }

    // Add a button for placing multi-grid obstacles
    const placeMultiGridBtn = document.createElement('button');
    placeMultiGridBtn.id = 'multi-grid-obstacle-btn';
    placeMultiGridBtn.textContent = 'Place Larger Obstacle';
    
    // Insert it after toggle-obstacle-btn
    if (toggleObstacleBtn.parentNode) {
        toggleObstacleBtn.parentNode.insertBefore(placeMultiGridBtn, toggleObstacleBtn.nextSibling);
    }
    
    placeMultiGridBtn.addEventListener('click', () => {
        currentMode = 'place_multi_grid';
        updateModeText();
        updateStatusMessage("Click on the grid to place a multi-grid obstacle. Will use the selected obstacle type.", 'info');
    });

    // Clear simulation should also clear multi-grid obstacles
    clearSimulationBtn.addEventListener('click', async () => {
        // This should ideally also call an endpoint on the backend to clear its state,
        // especially obstacles if they are primarily managed there.
        // For now, it re-initializes locally and can re-initialize via backend.
        
        if (warehouseWidth > 0 && warehouseHeight > 0) {
            updateStatusMessage("Resetting simulation by re-initializing warehouse...", 'info');
            // Trigger a re-initialization which clears backend obstacles too
             await fetch(`${BASE_API_URL}/initialize_warehouse`, { // Use await
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ width: warehouseWidth, height: warehouseHeight })
            });
        }
        
        obstacles.clear();
        multiGridObstacles = []; // Clear multi-grid obstacles too
        startPoint = null;
        endPoint = null;
        currentPath = [];
        robotPosition = null;
        currentMode = 'none';
        
        // Stop any animations
        if (animationInProgress) {
            clearTimeout(animationFrame);
            animationInProgress = false;
        }
        
        updateModeText();
        redrawAll();
        updateStatusMessage("Simulation reset. Initialize warehouse if needed.", 'info');
    });

    // Button click event handlers
    setStartBtn.addEventListener('click', () => {
        currentMode = 'set_start';
        updateModeText();
        updateStatusMessage("Click on the grid to set robot start position.", 'info');
    });

    setEndBtn.addEventListener('click', () => {
        currentMode = 'set_end';
        updateModeText();
        updateStatusMessage("Click on the grid to set destination point.", 'info');
    });

    toggleObstacleBtn.addEventListener('click', () => {
        currentMode = 'toggle_obstacle';
        updateModeText();
        updateStatusMessage("Click on grid cells to place or remove obstacles.", 'info');
    });

    // --- Initial UI Setup ---
    updateModeText();
    // To draw an empty grid initially based on default input values:
    // initWarehouseBtn.click(); // Or call a function that does local init for preview
    // For a cleaner start, user should click "Initialize Warehouse"
    updateStatusMessage("System ready. Please initialize warehouse dimensions.", 'info');
    
    // Create robot image data (as Base64)
    createRobotImage();
    createObstacleImages();
    createFlagImages();
});

// Base64 image creation functions
function createRobotImage() {
    // Create a canvas to generate the robot image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

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
    const imageData = canvas.toDataURL('image/png');
    
    // Set the image source
    robotImg.src = imageData;
}

function createObstacleImages() {
    // Create crate image
    const crateCanvas = document.createElement('canvas');
    crateCanvas.width = 100;
    crateCanvas.height = 100;
    const crateCtx = crateCanvas.getContext('2d');
    
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
    
    obstacleImages.crate.src = crateCanvas.toDataURL('image/png');
    
    // Create shelf image
    const shelfCanvas = document.createElement('canvas');
    shelfCanvas.width = 100;
    shelfCanvas.height = 100;
    const shelfCtx = shelfCanvas.getContext('2d');
    
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
    
    obstacleImages.shelf.src = shelfCanvas.toDataURL('image/png');
    
    // Create restricted area image
    const restrictedCanvas = document.createElement('canvas');
    restrictedCanvas.width = 100;
    restrictedCanvas.height = 100;
    const restrictedCtx = restrictedCanvas.getContext('2d');
    
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
    
    obstacleImages.restricted.src = restrictedCanvas.toDataURL('image/png');
}

function createFlagImages() {
    // Create start flag
    const startCanvas = document.createElement('canvas');
    startCanvas.width = 100;
    startCanvas.height = 100;
    const startCtx = startCanvas.getContext('2d');
    
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
    
    startFlag.src = startCanvas.toDataURL('image/png');
    
    // Create end flag
    const endCanvas = document.createElement('canvas');
    endCanvas.width = 100;
    endCanvas.height = 100;
    const endCtx = endCanvas.getContext('2d');
    
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
    
    endFlag.src = endCanvas.toDataURL('image/png');
}