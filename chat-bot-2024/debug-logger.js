// Enhanced debugging system for the chat application
// This ensures all logs are properly displayed in the console

// Setup debug logging system
(function() {
    // Store original console methods
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };

    // Create logging element for visual debugging
    const createVisualLogger = () => {
        // Only create if not already exists
        if (document.getElementById('visual-logger')) return;
        
        // Create logger container
        const loggerDiv = document.createElement('div');
        loggerDiv.id = 'visual-logger';
        loggerDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            max-width: 50%;
            max-height: 200px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            font-family: monospace;
            font-size: 12px;
            border-radius: 4px;
            padding: 10px;
            z-index: 9999;
            display: none;
        `;
        
        // Create header with toggle button
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            border-bottom: 1px solid #666;
            padding-bottom: 5px;
        `;
        
        const title = document.createElement('div');
        title.textContent = 'Debug Console';
        title.style.fontWeight = 'bold';
        
        const controls = document.createElement('div');
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = `
            background: #333;
            color: white;
            border: none;
            margin-right: 5px;
            padding: 2px 5px;
            border-radius: 2px;
            cursor: pointer;
        `;
        clearBtn.onclick = () => {
            const logArea = document.getElementById('log-entries');
            if (logArea) logArea.innerHTML = '';
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            background: #333;
            color: white;
            border: none;
            padding: 2px 5px;
            border-radius: 2px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => {
            loggerDiv.style.display = 'none';
            window._debugVisible = false;
        };
        
        controls.appendChild(clearBtn);
        controls.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(controls);
        
        // Create log area
        const logArea = document.createElement('div');
        logArea.id = 'log-entries';
        logArea.style.cssText = `
            max-height: 150px;
            overflow-y: auto;
        `;
        
        loggerDiv.appendChild(header);
        loggerDiv.appendChild(logArea);
        document.body.appendChild(loggerDiv);
        
        // Add keyboard shortcut (Alt+D) to toggle visibility
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'd') {
                window._debugVisible = !window._debugVisible;
                loggerDiv.style.display = window._debugVisible ? 'block' : 'none';
            }
        });
    };
    
    // Add entry to visual logger
    const addLogEntry = (message, type = 'log') => {
        createVisualLogger();
        
        const logArea = document.getElementById('log-entries');
        if (!logArea) return;
        
        const entry = document.createElement('div');
        entry.style.cssText = `
            margin: 2px 0;
            border-bottom: 1px solid #333;
            padding-bottom: 2px;
        `;
        
        // Set color based on log type
        let color = 'white';
        switch (type) {
            case 'error': color = '#ff4d4d'; break;
            case 'warn': color = '#ffcc00'; break;
            case 'info': color = '#66ccff'; break;
            default: color = 'white';
        }
        
        // Format timestamp
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        entry.innerHTML = `
            <span style="color: #999; font-size: 10px;">${timeStr}</span>
            <span style="color: ${color};">${formatLogMessage(message)}</span>
        `;
        
        logArea.appendChild(entry);
        logArea.scrollTop = logArea.scrollHeight;
    };
    
    // Format log message for better display
    const formatLogMessage = (message) => {
        if (typeof message === 'object') {
            try {
                return JSON.stringify(message, null, 2);
            } catch (e) {
                return String(message);
            }
        }
        return String(message);
    };
    
    // Override console methods
    console.log = function(...args) {
        // Call original method
        originalConsole.log.apply(console, args);
        
        // Add to visual logger
        addLogEntry(args.length === 1 ? args[0] : args.join(' '), 'log');
        
        // Log to server if needed
        if (window.logToServer) {
            fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level: 'log', message: args })
            }).catch(() => {}); // Ignore errors from logging
        }
    };
    
    console.error = function(...args) {
        originalConsole.error.apply(console, args);
        addLogEntry(args.length === 1 ? args[0] : args.join(' '), 'error');
    };
    
    console.warn = function(...args) {
        originalConsole.warn.apply(console, args);
        addLogEntry(args.length === 1 ? args[0] : args.join(' '), 'warn');
    };
    
    console.info = function(...args) {
        originalConsole.info.apply(console, args);
        addLogEntry(args.length === 1 ? args[0] : args.join(' '), 'info');
    };
    
    // Add debug utility to window
    window.debugLog = function(message, type = 'log') {
        switch(type) {
            case 'error': console.error(message); break;
            case 'warn': console.warn(message); break;
            case 'info': console.info(message); break;
            default: console.log(message);
        }
    };
    
    // Auto-show debug console if URL has debug parameter
    if (window.location.search.includes('debug=true')) {
        window._debugVisible = true;
        window.addEventListener('DOMContentLoaded', () => {
            createVisualLogger();
            const loggerDiv = document.getElementById('visual-logger');
            if (loggerDiv) loggerDiv.style.display = 'block';
            console.log('Debug mode activated via URL parameter');
        });
    }
    
    // Log a startup message
    window.addEventListener('DOMContentLoaded', () => {
        console.log('Debug logging system initialized. Press Alt+D to toggle debug panel.');
    });
})();

// Test log on load
console.log('Debug logger loaded successfully');
