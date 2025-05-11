from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS # For handling Cross-Origin Resource Sharing
import os

# Import our custom modules
from warehouse import Warehouse
from path_planning import find_path_bfs

# Get the absolute path to the frontend directory
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__)
CORS(app) # This will allow requests from your frontend (running on a different port)

# Global variable to store our warehouse instance.
# For a more complex application, you might manage state differently (e.g., sessions, database).
# For this simulator, a global variable is straightforward.
current_warehouse = None

@app.route('/')
def serve_frontend():
    """
    Serve the frontend index.html file
    """
    return send_from_directory(FRONTEND_DIR, 'index.html')

# Serve static files (script.js, style.css)
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.route('/api')
def home():
    """
    A simple root endpoint to check if the server is running.
    """
    return jsonify({"message": "Warehouse simulation backend is running!"})

@app.route('/api/initialize_warehouse', methods=['POST'])
def initialize_warehouse_endpoint():
    """
    Initializes or re-initializes the warehouse with given dimensions.
    Clears any existing obstacles.
    JSON Input: { "width": int, "height": int }
    """
    global current_warehouse
    data = request.get_json()

    if not data or 'width' not in data or 'height' not in data:
        return jsonify({"error": "Missing width or height in request"}), 400
    
    try:
        width = int(data['width'])
        height = int(data['height'])
        if width <= 0 or height <= 0:
            raise ValueError("Width and height must be positive integers.")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    current_warehouse = Warehouse(width, height)
    return jsonify({
        "message": f"Warehouse initialized with width {width} and height {height}.",
        "width": width,
        "height": height,
        "obstacles": list(current_warehouse.obstacles) # Initially empty
    }), 200

@app.route('/api/obstacle', methods=['POST', 'DELETE'])
def manage_obstacle():
    """
    Manages obstacles in the warehouse.
    POST: Adds an obstacle. JSON Input: { "x": int, "y": int }
    DELETE: Removes an obstacle. JSON Input: { "x": int, "y": int } (or query params for DELETE)
    """
    global current_warehouse
    if current_warehouse is None:
        return jsonify({"error": "Warehouse not initialized. Call /initialize_warehouse first."}), 400

    data = request.get_json()
    if not data or 'x' not in data or 'y' not in data:
        return jsonify({"error": "Missing x or y coordinates for obstacle"}), 400

    try:
        x = int(data['x'])
        y = int(data['y'])
    except ValueError:
        return jsonify({"error": "Invalid coordinates. x and y must be integers."}), 400

    if request.method == 'POST':
        if not current_warehouse.is_valid_location(x,y):
             return jsonify({"error": f"Cannot add obstacle at ({x},{y}): Out of bounds."}), 400
        if current_warehouse.add_obstacle(x, y):
            return jsonify({
                "message": f"Obstacle added at ({x},{y})",
                "obstacles": list(current_warehouse.obstacles)
            }), 200
        else:
            # This case might be redundant if is_valid_location is checked first
            return jsonify({"error": f"Failed to add obstacle at ({x},{y}). It might be out of bounds."}), 400
            
    elif request.method == 'DELETE':
        if current_warehouse.remove_obstacle(x, y):
            return jsonify({
                "message": f"Obstacle removed from ({x},{y})",
                "obstacles": list(current_warehouse.obstacles)
            }), 200
        else:
            return jsonify({"error": f"Failed to remove obstacle at ({x},{y}). It might not exist."}), 404 # Not Found

@app.route('/api/plan_path', methods=['POST'])
def plan_path_endpoint():
    """
    Calculates the path for the robot.
    JSON Input: {
        "start": {"x": int, "y": int},
        "end": {"x": int, "y": int}
    }
    (Assumes obstacles are already set in the current_warehouse instance)
    """
    global current_warehouse
    if current_warehouse is None:
        return jsonify({"error": "Warehouse not initialized. Call /initialize_warehouse first."}), 400

    data = request.get_json()
    if not data or 'start' not in data or 'end' not in data:
        return jsonify({"error": "Missing start or end points in request"}), 400

    try:
        start_coords = (int(data['start']['x']), int(data['start']['y']))
        end_coords = (int(data['end']['x']), int(data['end']['y']))
    except (TypeError, ValueError, KeyError):
        return jsonify({"error": "Invalid format for start or end points. Expecting {\"x\": int, \"y\": int}."}), 400

    if not current_warehouse.is_valid_location(start_coords[0], start_coords[1]):
        return jsonify({"error": f"Start point {start_coords} is out of bounds."}), 400
    if not current_warehouse.is_valid_location(end_coords[0], end_coords[1]):
        return jsonify({"error": f"End point {end_coords} is out of bounds."}), 400
    
    # The find_path_bfs function itself checks if start/end are obstacles
    # path = find_path_bfs(current_warehouse, start_coords, end_coords)
    
    # Ensure start/end are not obstacles BEFORE pathfinding for clearer API response
    if current_warehouse.is_obstacle(start_coords[0], start_coords[1]):
        return jsonify({"error": f"Start point {start_coords} is an obstacle."}), 400
    if current_warehouse.is_obstacle(end_coords[0], end_coords[1]):
        return jsonify({"error": f"End point {end_coords} is an obstacle."}), 400

    path = find_path_bfs(current_warehouse, start_coords, end_coords)

    if path:
        # Convert path tuples to list of dictionaries for easier JSON consumption
        formatted_path = [{"x": p[0], "y": p[1]} for p in path]
        return jsonify({"path": formatted_path}), 200
    else:
        return jsonify({"message": "No path found.", "path": []}), 200 # Or 404 if you prefer for no path

if __name__ == '__main__':
    # Runs the Flask development server.
    # Debug mode allows for auto-reloading on code changes and provides helpful debug info.
    # Host '0.0.0.0' makes it accessible from other devices on the same network.
    print("Warehouse Robot Simulator starting...")
    app.run(host='0.0.0.0', port=5000, debug=True)