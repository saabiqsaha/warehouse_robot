#!/bin/bash

# Start the Flask backend in a separate terminal
echo "Starting Flask backend..."
cd backend
python app.py &
BACKEND_PID=$!

# Wait for the backend to start
sleep 2

# Start the Next.js frontend
echo "Starting Next.js frontend..."
cd ../environment
npm run dev

# When Next.js is terminated (Ctrl+C), kill the Flask backend
echo "Shutting down Flask backend..."
kill $BACKEND_PID
