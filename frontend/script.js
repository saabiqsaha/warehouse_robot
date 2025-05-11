document.addEventListener('DOMContentLoaded', () => {
    // ... (all existing DOM element selections and variable initializations remain the same) ...
    // const canvas = ...
    // const ctx = ...
    // let warehouseWidth = 0;
    // let cellSize = 25; // Consider making this dynamic or theme-adjustable later
    // let obstacles = new Set();
    // let startPoint = null;
    // let endPoint = null;
    // let currentPath = [];
    // let robotPosition = null;
    // let currentMode = 'none';
    // const BASE_API_URL = 'http://localhost:5000';

    // Updated Theme Colors for Canvas Drawing
    const colors = {
        gridLines: '#e0e0e0', // Lighter grey for grid lines
        text: '#333333',
        // Obstacle type colors
        obstacle: { // Default obstacle color if not specified by type
            crate: '#78909c',   // Blue Grey (like a metal crate)
            shelf: '#546e7a',   // Darker Blue Grey (like a shelf unit)
            restricted: '#ef5350', // Muted Red (for restricted zone)
            default: '#607d8b'  // Default if type unknown
        },
        startPoint: '#4CAF50', // Green
        endPoint: '#f44336',   // Red
        path: '#007bff',       // Primary Blue (theme accent)
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        obstacles.forEach(obsDataString => { // Assuming obsDataString might store type later
            // For now, assume obsData is just "x,y". We need to enhance this if storing type.
            // Let's assume for now that `obstacles` stores objects: {x, y, type}
            // If it still stores "x,y", we need to decide how to get type or use a default
            
            // TEMP: If obstacles is a Set of "x,y" strings
            // We'll need to modify how obstacles are added to include type.
            // For this drawing step, let's assume a default type for now from the dropdown
            // OR, if we refactor adding obstacles to store type.
            
            // This part needs to be coordinated with how obstacles are stored.
            // If obstacles Set stores { x: number, y: number, type: string } objects:
            // obstacles.forEach(obs => {
            //    const obstacleColor = colors.obstacle[obs.type] || colors.obstacle.default;
            //    drawCell(obs.x, obs.y, obstacleColor, true);
            // });

            // CURRENTLY, obstacles set stores "x,y" strings.
            // We need to enhance this. For now, let's just draw with a selected type color
            // This is a simplification and ideally, the type should be stored WITH the obstacle.
            const [xStr, yStr] = obsDataString.split(',');
            const x = parseInt(xStr);
            const y = parseInt(yStr);
            
            // For DEMONSTRATION, let's assume all current obstacles take the selected type
            // This is NOT ideal for individual obstacle types, but shows color usage.
            // A better way is to store type with each obstacle when it's added.
            // I will make changes later to store type with obstacle.
            // For now, just to show the colors:
            const currentSelectedType = obstacleTypeSelect.value; // Get current selected type
            const obstacleColor = colors.obstacle[currentSelectedType] || colors.obstacle.default;
            drawCell(x, y, obstacleColor, true);
        });
    }

    function drawStartPoint() {
        if (startPoint) {
            drawCell(startPoint.x, startPoint.y, colors.startPoint);
        }
    }

    function drawEndPoint() {
        if (endPoint) {
            drawCell(endPoint.x, endPoint.y, colors.endPoint);
        }
    }

    function drawPath() {
        if (currentPath.length > 0) {
            ctx.strokeStyle = colors.path; // Use stroke for path lines
            ctx.lineWidth = Math.max(2, cellSize / 8); // Dynamic line width
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
        }
    }
    
    function drawRobot() {
        if (robotPosition) {
            const centerX = robotPosition.x * cellSize + cellSize / 2;
            const centerY = robotPosition.y * cellSize + cellSize / 2;
            const radius = cellSize / 2.5; // Robot slightly smaller than cell
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = colors.robot;
            ctx.fill();
            
            // Add a little direction indicator if you want
            ctx.beginPath();
            ctx.moveTo(centerX, centerY); // Center
            // Assuming robot faces right by default, or use an angle variable
            ctx.lineTo(centerX + radius * 0.8, centerY); 
            ctx.lineWidth = Math.max(1, cellSize / 10);
            ctx.strokeStyle = 'rgba(0,0,0,0.5)'; // Darker line for detail
            ctx.stroke();
        }
    }

    function redrawAll() {
        drawGrid(); // This now also resizes canvas based on available space
        drawObstacles();
        drawPath(); 
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
        currentModeTextEl.textContent = `Current Mode: ${modeDescription}`;
    }

    // --- Event Listeners ---
    // The initWarehouseBtn click listener should call redrawAll() AFTER backend confirmation.
    // For now, the local version will benefit from the new drawGrid sizing.
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
            data.obstacles.forEach(obs => obstacles.add(`${obs.x},${obs.y}`)); // If backend sends any default
            
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
            // const selectedType = obstacleTypeSelect.value; // We'll use this when sending to backend

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
                    // If backend now returns objects like {x,y,type}, adapt storage.
                    // For now, assuming it returns list of {x,y} like before and we store "x,y"
                    obstacles.add(`${obs.x},${obs.y}`);
                });

                successMessage = data.message;
                needsRedraw = true;

            } catch (error) {
                console.error(`Error ${action === 'POST' ? 'adding' : 'removing'} obstacle:`, error);
                updateStatusMessage(`Failed: ${error.message}`, 'error');
                return; // Don't redraw if backend failed
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
    
    // Update findPathBtn to use new status messages and path drawing
    findPathBtn.addEventListener('click', async () => {
        if (!startPoint || !endPoint) {
            updateStatusMessage("Please set both start and end points before finding a path.", 'error');
            return;
        }
        if (warehouseWidth === 0) {
            updateStatusMessage("Please initialize the warehouse first.", 'error');
            return;
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
                currentPath = data.path; // data.path is [{x,y}, {x,y}, ...]
                updateStatusMessage(`Path found with ${currentPath.length} steps.`, 'success');
                // Animate robot or just place at start
                robotPosition = { ...startPoint }; 
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
        startPoint = null;
        endPoint = null;
        currentPath = [];
        robotPosition = null;
        currentMode = 'none';
        updateModeText();
        redrawAll();
        updateStatusMessage("Simulation reset. Initialize warehouse if needed.", 'info');
    });


    // --- Initial UI Setup ---
    updateModeText();
    // To draw an empty grid initially based on default input values:
    // initWarehouseBtn.click(); // Or call a function that does local init for preview
    // For a cleaner start, user should click "Initialize Warehouse"
    updateStatusMessage("System ready. Please initialize warehouse dimensions.", 'info');
});