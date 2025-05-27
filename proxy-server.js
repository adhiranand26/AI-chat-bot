// Simple proxy server to bypass CORS restrictions
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 8086;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from chat-bot-2024 directory
app.use(express.static(path.join(__dirname, 'chat-bot-2024')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: port,
    message: 'Chat Bot Proxy Server is running!' 
  });
});

// Serve the main chat interface at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat-bot-2024', 'index.html'));
});

// Forward requests to VectorShift API
app.post('/api/vectorshift', async (req, res) => {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log(`📡 [${timestamp}] INCOMING POST REQUEST TO /api/vectorshift`);
    console.log('='.repeat(80));
    console.log('📋 Request Headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
      'origin': req.headers['origin'],
      'referer': req.headers['referer']
    });
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    console.log('📝 Input Query:', req.body.inputs?.input_0 || 'No input_0 found');
    console.log('🔗 Context Length:', req.body.inputs?.context?.length || 0, 'characters');
    
    // Ensure context is included in the inputs object
    if (!req.body.inputs) {
      req.body.inputs = {};
    }
    req.body.inputs.context = req.body.inputs.context || '';
    
    console.log('🚀 Forwarding to VectorShift API...');
    const startTime = Date.now();
    
    const response = await axios({
      method: 'post',
      url: 'https://api.vectorshift.ai/v1/pipeline/68334de260a135dd6c5c1d84/run',
      headers: {
        'Authorization': 'Bearer sk_bEDT4rqwtDNHIscIvdSXz0hduhfKKvcN25afipUVwzllmR50',
        'Content-Type': 'application/json'
      },
      data: req.body
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log('\n' + '-'.repeat(80));
    console.log(`✅ [${new Date().toISOString()}] API RESPONSE RECEIVED`);
    console.log('-'.repeat(80));
    console.log('⏱️  Response Time:', responseTime + 'ms');
    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('💬 Output Preview:', response.data.outputs?.output_0?.substring(0, 100) + '...' || 'No output_0 found');
    console.log('='.repeat(80) + '\n');
    
    res.json(response.data);
  } catch (error) {
    const errorTime = Date.now();
    console.log('\n' + '❌'.repeat(40));
    console.error(`🚨 [${new Date().toISOString()}] PROXY ERROR OCCURRED`);
    console.log('❌'.repeat(40));
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('Network/Connection Error - no response received');
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
    console.log('❌'.repeat(40) + '\n');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`💚 [${timestamp}] Health check requested from ${req.ip}`);
  res.send('Proxy server is running with enhanced logging');
});

// Serve static files from the chat-bot-2024 directory
app.use(express.static('./chat-bot-2024'));

// Add a root route that redirects to index.html
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './chat-bot-2024' });
});

app.listen(port, () => {
  console.log('\n' + '🚀'.repeat(50));
  console.log(`🌐 CHAT BOT PROXY SERVER STARTED`);
  console.log('🚀'.repeat(50));
  console.log(`📍 Server URL: http://localhost:${port}`);
  console.log(`🎯 Chat App: http://localhost:${port}`);
  console.log(`❤️  Health Check: http://localhost:${port}/health`);
  console.log(`📡 VectorShift Proxy: http://localhost:${port}/api/vectorshift`);
  console.log(`📊 Enhanced Logging: ENABLED`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚢 Heroku Port: ${process.env.PORT || 'Not set (using 8085)'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('🚀'.repeat(50));
  console.log('✅ Ready to handle requests with detailed terminal logging...\n');
});
