from collections import deque

def find_path_bfs(warehouse, start, end):
    """
    Finds the shortest path from start to end using Breadth-First Search (BFS).

    Args:
        warehouse (Warehouse): An instance of the Warehouse class, containing grid dimensions and obstacles.
        start (tuple): A tuple (x, y) for the starting position.
        end (tuple): A tuple (x, y) for the ending position.

    Returns:
        list: A list of (x, y) tuples representing the path from start to end,
              or None if no path is found.
    """
    start_x, start_y = start
    end_x, end_y = end

    # Check if start or end points are out of bounds or are obstacles
    if not warehouse.is_valid_location(start_x, start_y) or warehouse.is_obstacle(start_x, start_y):
        print(f"Start point {start} is invalid or an obstacle.")
        return None
    if not warehouse.is_valid_location(end_x, end_y) or warehouse.is_obstacle(end_x, end_y):
        print(f"End point {end} is invalid or an obstacle.")
        return None
    
    if start == end:
        return [start]

    # Possible moves: up, down, left, right (and optionally diagonals)
    # For now, only cardinal directions
    moves = [
        (0, -1),  # Up
        (0, 1),   # Down
        (-1, 0),  # Left
        (1, 0)    # Right
    ]
    # To allow diagonal moves (8 directions):
    # moves = [
    #     (0, -1), (0, 1), (-1, 0), (1, 0),
    #     (-1, -1), (-1, 1), (1, -1), (1, 1)
    # ]

    queue = deque([(start, [start])])  # Queue stores (current_position, current_path)
    visited = {start}                 # Set to keep track of visited cells

    while queue:
        (current_x, current_y), path = queue.popleft()

        # Explore neighbors
        for dx, dy in moves:
            next_x, next_y = current_x + dx, current_y + dy
            next_pos = (next_x, next_y)

            # Check if the neighbor is the destination
            if next_pos == end:
                return path + [end]

            # Check if the neighbor is valid, not an obstacle, and not visited
            if warehouse.is_valid_location(next_x, next_y) and \
               not warehouse.is_obstacle(next_x, next_y) and \
               next_pos not in visited:
                
                visited.add(next_pos)
                queue.append((next_pos, path + [next_pos]))
    
    print(f"No path found from {start} to {end}")
    return None # No path found

# Example Usage (optional - for testing this file directly)
if __name__ == "__main__":
    # This code runs only if you execute path_planning.py directly
    # Requires warehouse.py to be in the same directory or accessible in PYTHONPATH
    from warehouse import Warehouse

    # Test Case 1: Simple path
    print("--- Test Case 1: Simple Path ---")
    wh = Warehouse(5, 5)
    start_node = (0, 0)
    end_node = (4, 4)
    path = find_path_bfs(wh, start_node, end_node)
    if path:
        print(f"Path from {start_node} to {end_node}: {path}")
    else:
        print(f"No path found from {start_node} to {end_node}")

    # Test Case 2: Path with obstacles
    print("\n--- Test Case 2: Path with Obstacles ---")
    wh_obs = Warehouse(5, 5)
    wh_obs.add_obstacle(1, 0)
    wh_obs.add_obstacle(1, 1)
    wh_obs.add_obstacle(1, 2) # Wall
    # wh_obs.add_obstacle(0, 1) # Alternative obstacle to block start
    
    start_node_obs = (0, 0)
    end_node_obs = (2, 0)
    path_obs = find_path_bfs(wh_obs, start_node_obs, end_node_obs)
    if path_obs:
        print(f"Path from {start_node_obs} to {end_node_obs}: {path_obs}")
    else:
        print(f"No path found from {start_node_obs} to {end_node_obs}") # Expected if (1,0) is blocked

    # Test Case 3: No path possible
    print("\n--- Test Case 3: No Path Possible ---")
    wh_no_path = Warehouse(3, 3)
    wh_no_path.add_obstacle(1, 0)
    wh_no_path.add_obstacle(1, 1)
    wh_no_path.add_obstacle(1, 2) # A complete wall
    start_no_path = (0, 1)
    end_no_path = (2, 1)
    no_path_result = find_path_bfs(wh_no_path, start_no_path, end_no_path)
    if no_path_result:
        print(f"Path from {start_no_path} to {end_no_path}: {no_path_result}")
    else:
        print(f"No path found from {start_no_path} to {end_no_path}")
        
    # Test Case 4: Start or End is obstacle
    print("\n--- Test Case 4: Start or End is Obstacle ---")
    wh_invalid_start_end = Warehouse(3,3)
    wh_invalid_start_end.add_obstacle(0,0) # Obstacle at start
    path_invalid = find_path_bfs(wh_invalid_start_end, (0,0), (2,2))
    assert path_invalid is None
    print("Test for start as obstacle passed.")

    wh_invalid_start_end.remove_obstacle(0,0)
    wh_invalid_start_end.add_obstacle(2,2) # Obstacle at end
    path_invalid = find_path_bfs(wh_invalid_start_end, (0,0), (2,2))
    assert path_invalid is None
    print("Test for end as obstacle passed.")