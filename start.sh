#!/bin/zsh
# Start script for running the chat bot with proxy server

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it first."
    exit 1
fi

# Change to the directory containing this script
cd "$(dirname "$0")" || exit

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "Dependencies installed!"
fi

# Start the proxy server
echo "Starting proxy server..."
node proxy-server.js
