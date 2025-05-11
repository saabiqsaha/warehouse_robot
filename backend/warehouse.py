class Warehouse:
    def __init__(self, width, height):
        """
        Initializes the warehouse grid.
        Args:
            width (int): The number of columns in the grid.
            height (int): The number of rows in the grid.
        """
        self.width = width
        self.height = height
        # Initialize an empty set to store obstacle coordinates (x, y)
        self.obstacles = set()
        print(f"Warehouse initialized with width: {self.width}, height: {self.height}")

    def add_obstacle(self, x, y):
        """
        Adds an obstacle to the grid at the given coordinates.
        Args:
            x (int): The x-coordinate (column).
            y (int): The y-coordinate (row).
        Returns:
            bool: True if the obstacle was added successfully, False otherwise (e.g., out of bounds).
        """
        if 0 <= x < self.width and 0 <= y < self.height:
            self.obstacles.add((x, y))
            print(f"Obstacle added at ({x}, {y})")
            return True
        print(f"Failed to add obstacle at ({x}, {y}): Out of bounds.")
        return False

    def remove_obstacle(self, x, y):
        """
        Removes an obstacle from the grid at the given coordinates.
        Args:
            x (int): The x-coordinate.
            y (int): The y-coordinate.
        Returns:
            bool: True if the obstacle was removed successfully, False otherwise (e.g., not found).
        """
        if (x, y) in self.obstacles:
            self.obstacles.remove((x, y))
            print(f"Obstacle removed from ({x}, {y})")
            return True
        print(f"Failed to remove obstacle at ({x}, {y}): Not found.")
        return False

    def is_obstacle(self, x, y):
        """
        Checks if a given coordinate is an obstacle.
        Args:
            x (int): The x-coordinate.
            y (int): The y-coordinate.
        Returns:
            bool: True if the coordinate is an obstacle, False otherwise.
        """
        return (x, y) in self.obstacles

    def is_valid_location(self, x, y):
        """
        Checks if a given coordinate is within the bounds of the warehouse.
        Args:
            x (int): The x-coordinate.
            y (int): The y-coordinate.
        Returns:
            bool: True if the coordinate is valid, False otherwise.
        """
        return 0 <= x < self.width and 0 <= y < self.height

    def get_grid_status(self):
        """
        Returns a representation of the grid, perhaps for debugging or simple visualization.
        'S' for start, 'E' for end, 'X' for obstacle, '.' for empty.
        (This is a placeholder, actual visualization will be on frontend)
        """
        grid = [['.' for _ in range(self.width)] for _ in range(self.height)]
        for obs_x, obs_y in self.obstacles:
            if 0 <= obs_x < self.width and 0 <= obs_y < self.height:
                grid[obs_y][obs_x] = 'X' # Assuming y is row, x is column
        return grid

    def clear_obstacles(self):
        """Clears all obstacles from the warehouse."""
        self.obstacles.clear()
        print("All obstacles cleared.")

# Example Usage (optional - for testing this file directly)
if __name__ == "__main__":
    # This code runs only if you execute warehouse.py directly (e.g., python backend/warehouse.py)
    warehouse = Warehouse(10, 5)
    warehouse.add_obstacle(2, 2)
    warehouse.add_obstacle(2, 3)
    warehouse.add_obstacle(5, 0)
    warehouse.add_obstacle(10, 3) # Out of bounds

    print(f"Is (2,2) an obstacle? {warehouse.is_obstacle(2,2)}")
    print(f"Is (0,0) an obstacle? {warehouse.is_obstacle(0,0)}")
    print(f"Is (5,0) a valid location? {warehouse.is_valid_location(5,0)}")
    
    status = warehouse.get_grid_status()
    print("\nGrid Status:")
    for row in status:
        print(" ".join(row))

    warehouse.remove_obstacle(2,2)
    print(f"Is (2,2) an obstacle after removal? {warehouse.is_obstacle(2,2)}")

    warehouse.clear_obstacles()
    print(f"Obstacles after clearing: {warehouse.obstacles}")