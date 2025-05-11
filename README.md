# Warehouse Robot Simulator

A web-based warehouse robot simulator that allows you to:
- Create a customizable warehouse grid
- Place and remove obstacles
- Set start and destination points
- Calculate and visualize optimal robot paths

## Getting Started

### Prerequisites

- Python 3.6 or higher
- pip (Python package manager)

### Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install required dependencies:

```bash
pip install -r backend/requirements.txt
```

### Running the Application

1. Start the application by running:

```bash
cd backend
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

The web interface will be automatically loaded, and you'll be able to use the simulator right away.

## How to Use

1. **Initialize the Warehouse**:
   - Enter the desired grid dimensions (width and height)
   - Click "Initialize Warehouse"

2. **Set Navigation Points**:
   - Click "Set Robot Start" and then click on the grid to place the starting point
   - Click "Set Destination" and then click on the grid to place the destination

3. **Manage Obstacles**:
   - Select an obstacle type from the dropdown
   - Click "Place/Remove Obstacle" and then click on grid cells to add or remove obstacles
   - Click on an existing obstacle to remove it

4. **Calculate Path**:
   - After setting both start and destination points, click "Calculate Path"
   - The optimal path will be displayed on the grid

5. **Reset Simulation**:
   - Click "Reset Simulation" to clear the grid and start over

## Project Structure

- **backend/** - Contains the Flask server and path-finding algorithms
  - **app.py** - Main Flask application
  - **warehouse.py** - Warehouse model
  - **path_planning.py** - Path-finding algorithms
  
- **frontend/** - Contains the web interface
  - **index.html** - Main HTML file
  - **script.js** - JavaScript for UI and API interactions
  - **style.css** - CSS styling

## Technologies Used

- **Backend**: Python, Flask, Flask-CORS
- **Frontend**: HTML5, CSS3, JavaScript