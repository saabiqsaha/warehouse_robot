# Warehouse Robot Simulator

A web-based simulator that lets you create a warehouse environment, place obstacles, and calculate optimal robot paths with visual feedback.

## Setup

### Prerequisites
- Python 3.6+
- Node.js and npm

### Installation & Running

**Backend:**
```bash
pip install -r backend/requirements.txt
cd backend
python app.py
```

**Frontend:**
```bash
cd environment
npm install
npm run dev
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Features

- Configure warehouse grid dimensions
- Place/remove different types of obstacles
- Set robot start and destination points
- Calculate and visualize optimal paths
- Predefined environment templates (Amazon Fulfilment Center, Nvidia GPU Farm, Tesla Gigafactory)
- Sprite-based visualization

## Usage

1. Select a predefined environment or initialize a custom warehouse
2. Set robot start and destination points by clicking on the grid
3. Add obstacles as needed
4. Click "Calculate Path" to find the optimal route
5. Use "Reset Simulation" to start over

## Project Structure

- **backend/**: Flask server and path-finding algorithms
- **environment/**: Next.js frontend application
- **public/sprites/**: Visual assets for environment objects