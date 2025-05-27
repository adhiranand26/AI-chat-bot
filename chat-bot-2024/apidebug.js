// Helper functions for debugging the VectorShift API integration
console.log('Loading API debugging tools...');

// Make the test function available globally
window.testVectorShiftAPI = function(query = "test hello") {
  console.group("🔍 Manual VectorShift API Test");
  console.log("Testing VectorShift API with query:", query);
  
  // Use proxy server URL to avoid CORS issues
  const proxyUrl = '/api/vectorshift';
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No Authorization header - the proxy adds it
    },
    body: JSON.stringify({
      inputs: {
        input_0: query
      }
    })
  };

  console.log('Request body:', JSON.parse(options.body));
  console.log('Sending request to proxy server...');
  console.time('API Request Duration');

  fetch(proxyUrl, options)
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return response.json();
    })
    .then(response => {
      console.timeEnd('API Request Duration');
      console.log("VectorShift API Success Response:", response);
      if (response.outputs && response.outputs.output_0) {
        console.log("Output:", response.outputs.output_0);
      }
      console.groupEnd();
    })
    .catch(err => {
      console.timeEnd('API Request Duration');
      console.error("VectorShift API Error:", err);
      console.groupEnd();
    });
};

// Debugging helper that shows the request process step by step
window.debugAPIRequest = function(query = "test hello") {
  console.group("🔍 API Request Debug");
  
  // Step 1: Create request body
  const reqBody = {
    inputs: {
      input_0: query
    }
  };
  
  console.log('1. Request body (pre-stringify):', reqBody);
  
  // Step 2: Stringify body
  const stringifiedBody = JSON.stringify(reqBody);
  console.log('2. Stringified body:', stringifiedBody);
  
  // Step 3: Parse back to verify format
  const parsedBody = JSON.parse(stringifiedBody);
  console.log('3. Parsed back body:', parsedBody);
  
  // Step 4: Build headers
  const headers = {
    Authorization: 'Bearer sk_bEDT4rqwtDNHIscIvdSXz0hduhfKKvcN25afipUVwzllmR50',
    'Content-Type': 'application/json'
  };
  
  console.log('4. Request headers:', { ...headers, Authorization: '***REDACTED***' });
  
  // Step 5: Full request options
  const options = {
    method: 'POST',
    headers: headers,
    body: stringifiedBody
  };
  
  console.log('5. Full request options:', { 
    method: options.method,
    headers: { ...options.headers, Authorization: '***REDACTED***' },
    body: JSON.parse(options.body)
  });
  
  console.log('Debug complete. Use testVectorShiftAPI() to perform the actual request.');
  console.groupEnd();
};

// Log the global availability of debugging functions
console.log(`
🔧 API Debug Tools Available:
- testVectorShiftAPI("your query") - Test the API with a specific query
- debugAPIRequest("your query") - Debug the request formatting
`);
