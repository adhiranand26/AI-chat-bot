# Chat Bot with VectorShift API Integration

## Overview
This chat bot integrates with VectorShift API for intelligent responses. The application includes a proxy server to bypass CORS issues when communicating with the VectorShift API.

## Setup and Running the Application

### Prerequisites
- Node.js installed (v14 or higher)

### Quick Start
1. Run the start script:
```bash
./start.sh
```

This will:
- Install necessary dependencies
- Start the proxy server
- Serve the chat application

2. Open your browser and go to:
```
http://localhost:8085
```

### Manual Setup
If you prefer to set up manually:

1. Install dependencies:
```bash
npm install
```

2. Start the proxy server:
```bash
node proxy-server.js
```

3. Open your browser and go to http://localhost:8085

## Troubleshooting

### API Connection Issues
- Check browser console for detailed logs
- Test API connection using the built-in API test button
- Verify that the proxy server is running

### CORS Issues
The proxy server is designed to handle CORS issues by forwarding requests to the VectorShift API with the appropriate headers. If you're still seeing CORS errors:

1. Verify the proxy server is running
2. Check that all API calls are going through the proxy URL (/api/vectorshift)
3. Ensure no direct calls are being made to the VectorShift API

## Debug Tools
The application includes built-in debugging tools:

- In browser console, run `testVectorShiftAPI("your query")` to test the API connection
- In browser console, run `debugAPIRequest("your query")` to view request formatting
