// Standalone test script for VectorShift API
document.addEventListener('DOMContentLoaded', () => {
    // API test functionality available but no UI button created
    console.log('API test functionality loaded. Use runDetailedApiTest() in console if needed.');
});

/*
// Test button function - disabled for production
function addTestButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '10px';
    buttonContainer.style.right = '10px';
    buttonContainer.style.zIndex = '1000';

    const testButton = document.createElement('button');
    testButton.textContent = 'Test API';
    testButton.style.padding = '8px 16px';
    testButton.style.backgroundColor = '#4285f4';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    testButton.onclick = runDetailedApiTest;

    buttonContainer.appendChild(testButton);
    document.body.appendChild(buttonContainer);
}
*/

// Comprehensive API test function
async function runDetailedApiTest() {
    console.group('🔍 VectorShift API Test');
    console.log('Starting comprehensive API test...');

    // Create a test message DIV in the chat
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) {
        console.error('Chat box element not found');
        return;
    }

    const testMessageDiv = document.createElement('div');
    testMessageDiv.className = 'message system-message';
    testMessageDiv.innerHTML = `
        <div class="message-content">
            <h4>🔍 API Test in Progress</h4>
            <p>Running comprehensive API test...</p>
            <pre id="api-test-results">Test running...</pre>
        </div>
    `;
    chatBox.appendChild(testMessageDiv);
    testMessageDiv.scrollIntoView({ behavior: 'smooth' });

    const resultsElement = testMessageDiv.querySelector('#api-test-results');
    
    try {
        // Test parameters
        const testQuery = "Hello, this is a test message";
        
        // Step 1: Test environment
        updateResults(resultsElement, '1. Checking environment...');
        const envInfo = {
            userAgent: navigator.userAgent,
            apiUrl: 'https://api.vectorshift.ai/v1/pipeline/68334de260a135dd6c5c1d84/run',
            apiKeyLength: 'sk_bEDT4rqwtDNHIscIvdSXz0hduhfKKvcN25afipUVwzllmR50'.length,
            connectionStatus: window.navigator.onLine ? 'Online' : 'Offline'
        };
        console.log('Environment info:', envInfo);
        updateResults(resultsElement, '✓ Environment check complete', JSON.stringify(envInfo, null, 2));
        
        // Step 2: Prepare request
        updateResults(resultsElement, '2. Preparing API request...');
        const options = {
            method: 'POST',
            headers: {
                Authorization: 'Bearer sk_bEDT4rqwtDNHIscIvdSXz0hduhfKKvcN25afipUVwzllmR50',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {
                    input_0: testQuery
                }
            })
        };
        console.log('Request options prepared:', {
            method: options.method,
            headers: { ...options.headers, Authorization: '***REDACTED***' },
            body: JSON.parse(options.body)
        });
        updateResults(resultsElement, '✓ Request prepared', "Request body formatted correctly");
        
        // Step 3: Send request
        updateResults(resultsElement, '3. Sending API request...');
        console.time('API Request Time');
        const startTime = performance.now();
        
        const response = await fetch('https://api.vectorshift.ai/v1/pipeline/68334de260a135dd6c5c1d84/run', options);
        
        const endTime = performance.now();
        console.timeEnd('API Request Time');
        
        // Step 4: Process response status
        const responseTime = Math.round(endTime - startTime);
        updateResults(resultsElement, `4. Response received (${responseTime}ms)...`);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }
        
        // Step 5: Parse and validate response
        updateResults(resultsElement, '5. Parsing response data...');
        const data = await response.json();
        console.log('API response data:', data);
        
        if (!data.outputs || !data.outputs.output_0) {
            throw new Error('Invalid response format: missing output_0');
        }
        
        // Step 6: Results
        updateResults(
            resultsElement, 
            '✅ API Test Successful!', 
            `Response time: ${responseTime}ms\nResponse: "${data.outputs.output_0.substring(0, 100)}..."`
        );
        console.log('Test complete - Success!');
        
    } catch (error) {
        console.error('API test failed:', error);
        updateResults(
            resultsElement, 
            '❌ API Test Failed', 
            `Error: ${error.message}\n\nStack: ${error.stack}`
        );
    }
    
    console.groupEnd();
}

function updateResults(element, status, details = '') {
    element.innerHTML = `<strong>${status}</strong>` + (details ? `\n\n${details}` : '');
}
