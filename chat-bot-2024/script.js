// Chat history to maintain context
let chatHistory = [];
let sessionContext = ''; // Store context from previous sessions
let isFirstMessage = true;
let isApiConnected = false; // Track API connection status
const API_KEY = 'sk_bEDT4rqwtDNHIscIvdSXz0hduhfKKvcN25afipUVwzllmR50';
// Use local proxy to avoid CORS issues
const API_URL = '/api/vectorshift';  // This will be routed through our proxy server
const DIRECT_API_URL = 'https://api.vectorshift.ai/v1/pipeline/68334de260a135dd6c5c1d84/run';
const CONNECTION_TIMEOUT = 5000; // Timeout for API connection test in milliseconds

// Initialize the chat interface
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupEventListeners();
    setupTheme();
    animateOnLoad();
    setupNotificationContainer();
    setupRippleObserver(); // Add ripple effect to buttons
    createWavyText(); // Create wavy text animation
    
    // Always test API connection on startup
    console.log('Testing API connection on startup...');
    testApiConnection();
    
    // Set initial status (will be updated by testApiConnection)
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('status-text');
    const connectionDots = document.querySelector('.connection-dots');
    
    if (statusIndicator) statusIndicator.className = 'status-indicator connecting';
    if (statusText) statusText.textContent = 'Connecting to API...';
    if (connectionDots) connectionDots.style.display = 'flex';
});

const sendButton = document.getElementById('sent-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const charCount = document.getElementById('char-count');
let isProcessing = false;

// Initialize chat interface
function initializeChat() {
    // Show welcome message initially
    showWelcomeMessage();
    
    // Setup sidebar animations
    setTimeout(() => {
        animateSidebarItems();
    }, 300);
}

// Setup all event listeners
function setupEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Enhanced input handling with character count
    userInput.addEventListener('input', function() {
        const length = this.value.length;
        const maxLength = 2000;
        
        // Update character count
        if (charCount) {
            charCount.textContent = length;
            charCount.parentElement.style.color = length > maxLength * 0.9 ? 'var(--error-color)' : 'var(--text-secondary)';
        }
        
        // Enable/disable send button
        sendButton.disabled = !this.value.trim() || length > maxLength;
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        
        // Show typing indicator to user (visual feedback)
        if (this.value.trim() && !isProcessing) {
            sendButton.classList.add('pulse');
        } else {
            sendButton.classList.remove('pulse');
        }
    });
    
    // Add event listener for reconnect button
    const reconnectBtn = document.getElementById('reconnect-btn');
    if (reconnectBtn) {
        reconnectBtn.addEventListener('click', function() {
            // Just update the UI, don't actually test connection
            const statusIndicator = document.querySelector('.status-indicator');
            const statusText = document.getElementById('status-text');
            
            if (statusIndicator) statusIndicator.className = 'status-indicator online';
            if (statusText) statusText.textContent = 'API Connected';
            reconnectBtn.style.display = 'none';
            
            isApiConnected = true;
            showNotification('Connected to API successfully', 'success');
        });
    }

    // Focus input on page load
    setTimeout(() => userInput.focus(), 100);
}

// Show welcome message with enhanced animations
function showWelcomeMessage() {
    const welcomeMsg = chatBox.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.display = 'block';
        setTimeout(() => {
            welcomeMsg.style.opacity = '1';
            welcomeMsg.style.transform = 'translateY(0)';
            
            // Staggered animation for prompt buttons
            const promptBtns = welcomeMsg.querySelectorAll('.prompt-btn');
            promptBtns.forEach((btn, index) => {
                btn.style.opacity = '0';
                btn.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    btn.style.transition = 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                }, (index + 1) * 150 + 300);
            });
        }, 300);
    }
}

// Hide welcome message when first message is sent
function hideWelcomeMessage() {
    const welcomeMsg = chatBox.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.opacity = '0';
        welcomeMsg.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            welcomeMsg.style.display = 'none';
        }, 300);
    }
}

// Use suggested prompt
function usePrompt(prompt) {
    userInput.value = prompt;
    userInput.focus();
    sendMessage();
}

// Clear chat function
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatHistory = [];
        chatBox.innerHTML = '';
        showWelcomeMessage();
        isFirstMessage = true;
        
        // Show success feedback
        showNotification('Chat cleared successfully', 'success');
    }
}

// Export chat function - exports as text file
function exportChat() {
    if (chatHistory.length === 0) {
        showNotification('No chat history to export', 'warning');
        return;
    }
    
    let chatText = '';
    chatHistory.forEach(entry => {
        const role = entry.role === 'user' ? 'You' : 'AI';
        const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '';
        chatText += `[${timestamp}] ${role}: ${entry.content}\n\n`;
    });
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Chat exported successfully', 'success');
}

// Setup notification container
function setupNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.id = 'notification-container';
    document.body.appendChild(container);
}

// Enhanced show notification
function showNotification(message, type = 'info', title = null) {
    const container = document.getElementById('notification-container') || document.body;
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    const iconClass = type === 'success' ? 'fa-check-circle' : 
                     type === 'warning' ? 'fa-exclamation-triangle' : 
                     type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    
    // Create notification content
    notification.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
        <div class="notification-progress"></div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Setup close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    });
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-dismiss after delay
    setTimeout(() => {
        if (container.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

// Animate sidebar items
function animateSidebarItems() {
    const staggerItems = document.querySelectorAll('.stagger-item');
    staggerItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Page load animations
function animateOnLoad() {
    const elements = document.querySelectorAll('.enhanced-card, .glass-card');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animate-in');
        }, index * 150);
    });
}

// Handle message sending with context awareness
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '' || isProcessing || message.length > 2000) return;

    // Hide welcome message on first user message
    if (isFirstMessage) {
        hideWelcomeMessage();
        isFirstMessage = false;
    }

    isProcessing = true;
    userInput.disabled = true;
    sendButton.disabled = true;
    sendButton.classList.remove('pulse');

    try {
        // Clear input immediately for better UX
        userInput.value = '';
        userInput.style.height = 'auto';
        if (charCount) charCount.textContent = '0';

        // Check if this is a follow-up question using context
        const isFollowUp = detectFollowUpQuestion(message);
        
        // Append user message with animation
        const userMessageDiv = appendMessage('user', message, isFollowUp);
        chatHistory.push({ 
            role: 'user', 
            content: message,
            timestamp: Date.now(),
            isFollowUp: isFollowUp
        });

        // Show enhanced typing indicator
        const typingIndicator = showTypingIndicator();

        // Minor delay before making the API call for better UX
        const processingTime = Math.random() * 300 + 200;
        setTimeout(async () => {
            try {
                // Get response from API with fallback to local
                const botResponse = await getBotResponse(message);
                
                // Remove typing indicator
                typingIndicator.remove();
                
                // Stream the response with context awareness
                streamResponse(botResponse, isFollowUp);
                
                // Add to chat history
                chatHistory.push({ 
                    role: 'assistant', 
                    content: botResponse,
                    timestamp: Date.now(),
                    isFollowUp: isFollowUp
                });
            } catch (error) {
                console.error("Failed to get response:", error);
                typingIndicator.remove();
                
                // Handle error with a user-friendly message
                const errorMessage = "I'm sorry, I encountered a problem generating a response. Please try again.";
                streamResponse(errorMessage, false);
                
                chatHistory.push({ 
                    role: 'assistant', 
                    content: errorMessage,
                    timestamp: Date.now(),
                    isFollowUp: false
                });
            }
        }, processingTime);

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'I apologize, but I encountered an error. Please try again.';
        streamResponse(errorMessage);
        showNotification('An error occurred', 'error', 'Message Processing Error');
        chatHistory.push({ role: 'assistant', content: errorMessage });
    } finally {
        setTimeout(() => {
            isProcessing = false;
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }, 100);
    }
}

// Detect if a message is likely a follow-up question using context clues
function detectFollowUpQuestion(message) {
    if (chatHistory.length < 2) return false;
    
    // Keywords that suggest follow-up
    const followUpKeywords = [
        'what about', 'how about', 'and', 'also', 'additionally',
        'what if', 'could you', 'can you also', 'then', 'so',
        'tell me more', 'explain further', 'elaborate', 'why',
        'but', 'however', 'although', 'otherwise', 'another',
        'similarly', 'likewise', 'instead'
    ];
    
    // Check for pronouns that might refer to previous context
    const contextPronouns = [
        'it', 'this', 'that', 'these', 'those', 'they', 'them', 
        'their', 'he', 'she', 'his', 'her', 'its'
    ];
    
    // Check if message starts with a lowercase letter (often indicates continuation)
    const startsWithLowercase = /^[a-z]/.test(message);
    
    // Check if very short question (likely depends on context)
    const isShortQuestion = message.split(' ').length < 4 && message.includes('?');
    
    // Check for keywords
    const hasFollowUpKeyword = followUpKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check for pronouns
    const hasContextPronoun = contextPronouns.some(pronoun => {
        const regex = new RegExp(`\\b${pronoun}\\b`, 'i');
        return regex.test(message);
    });
    
    return startsWithLowercase || isShortQuestion || hasFollowUpKeyword || hasContextPronoun;
}

// Show enhanced typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <span class="typing-text">AI is typing...</span>
    `;
    
    typingDiv.style.opacity = '0';
    typingDiv.style.transform = 'translateY(10px)';
    
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Add subtle pulse animation to chat header status
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.classList.add('thinking');
    }
    
    // Animate the typing indicator
    setTimeout(() => {
        typingDiv.style.opacity = '1';
        typingDiv.style.transform = 'translateY(0)';
    }, 50);
    
    return typingDiv;
}

// Remove typing indicator effects
function removeTypingEffects() {
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.classList.remove('thinking');
    }
}

// Configuration for markdown
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true
});

// Suggested prompts
const suggestedPrompts = [
    "What can you help me with?",
    "Tell me about artificial intelligence",
    "How do I start learning programming?",
    "Give me some productivity tips"
];

// Show suggested prompts after bot messages with improved styling
function showSuggestedPrompts() {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggested-prompts';
    
    // We're removing the heading as requested
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'suggestions-container';
    
    // Randomly select 3 prompts
    const randomPrompts = [...suggestedPrompts]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    randomPrompts.forEach(prompt => {
        const button = document.createElement('button');
        button.className = 'suggestion-button';
        button.textContent = prompt;
        // Add ripple effect to buttons
        button.setAttribute('data-has-ripple', 'true');
        button.onclick = (e) => {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            button.appendChild(ripple);
            
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Set user input and send message
            userInput.value = prompt;
            suggestionsDiv.remove();
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
                sendMessage();
            }, 300);
        };
        buttonContainer.appendChild(button);
    });
    
    suggestionsDiv.appendChild(buttonContainer);
    
    // Add with animation
    suggestionsDiv.style.opacity = '0';
    suggestionsDiv.style.transform = 'translateY(10px)';
    chatBox.appendChild(suggestionsDiv);
    
    // Trigger animation after DOM update
    setTimeout(() => {
        suggestionsDiv.style.opacity = '1';
        suggestionsDiv.style.transform = 'translateY(0)';
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
}

// Function to add enhanced copy button to code blocks
function addCopyButtons() {
    document.querySelectorAll('pre code').forEach((codeBlock) => {
        const container = codeBlock.parentElement;
        
        // Detect language for header
        let language = '';
        if (codeBlock.className) {
            const match = codeBlock.className.match(/language-(\w+)/);
            if (match) language = match[1];
        }
        
        // Create header with language and copy button
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        const languageSpan = document.createElement('span');
        languageSpan.className = 'code-block-language';
        languageSpan.textContent = language || 'code';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-button';
        copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
        
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
                
                // Add success animation
                copyButton.style.background = 'rgba(16, 185, 129, 0.2)';
                copyButton.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                
                setTimeout(() => {
                    copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
                    copyButton.style.background = 'rgba(255, 255, 255, 0.1)';
                    copyButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }, 2000);
                
                // Show notification
                showNotification('Code copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy text: ', err);
                showNotification('Failed to copy code', 'error');
            }
        });
        
        header.appendChild(languageSpan);
        header.appendChild(copyButton);
        container.insertBefore(header, codeBlock);
        
        container.style.position = 'relative';
        container.style.paddingTop = '0';
    });
}

// Enhanced appendMessage function with message grouping and context awareness
function appendMessage(sender, message, contextFlag = false) {
    // First, check if we should create a new message group or add to existing
    let messageGroup;
    const lastMessage = chatBox.querySelector('.message:last-child');
    const lastMessageGroup = chatBox.querySelector('.message-group:last-child');
    
    // Check if we should create a new group or add to existing group
    const shouldCreateNewGroup = !lastMessageGroup || 
                                lastMessageGroup.getAttribute('data-sender') !== sender ||
                                (Date.now() - parseInt(lastMessageGroup.getAttribute('data-timestamp') || 0)) > 120000; // 2 minute gap
    
    if (shouldCreateNewGroup) {
        // Create a new message group
        messageGroup = document.createElement('div');
        messageGroup.className = `message-group ${sender}-group`;
        messageGroup.setAttribute('data-sender', sender);
        messageGroup.setAttribute('data-timestamp', Date.now());
        chatBox.appendChild(messageGroup);
    } else {
        // Use existing group
        messageGroup = lastMessageGroup;
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Add context-aware class if needed
    if (contextFlag) {
        messageDiv.classList.add('context-aware');
    }
    
    // Add avatar for better visual hierarchy
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (sender === 'bot') {
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (sender === 'bot') {
        content.innerHTML = marked.parse(message);
        setTimeout(() => {
            // Highlight code blocks
            messageDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
            // Add copy buttons
            addCopyButtons();
        }, 0);
    } else {
        content.textContent = message;
    }
    
    const messageBody = document.createElement('div');
    messageBody.className = 'message-body';
    messageBody.appendChild(content);
    
    // Create enhanced timestamp with status
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    
    // Format time
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    // Add status indicators for user messages
    if (sender === 'user') {
        timestamp.innerHTML = `
            <span>${timeStr}</span>
            <span class="message-status">
                <i class="fas fa-check status-icon"></i>
                <span>Sent</span>
            </span>
        `;
    } else {
        timestamp.innerHTML = `<span>${timeStr}</span>`;
        
        // Add context count if this is a context-aware message
        if (contextFlag) {
            const contextCount = document.createElement('span');
            contextCount.className = 'context-count';
            contextCount.innerHTML = `<i class="fas fa-link"></i> Context`;
            timestamp.appendChild(contextCount);
        }
    }
    
    messageBody.appendChild(timestamp);
    
    // Add action buttons for bot messages
    if (sender === 'bot') {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'message-actions';
        
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'action-button regenerate';
        regenerateButton.innerHTML = '<i class="fas fa-redo"></i>';
        regenerateButton.title = 'Regenerate response';
        regenerateButton.onclick = () => {
            if (isProcessing) return;
            messageDiv.remove();
            // Find the last user message to regenerate response
            const lastUserMessage = chatHistory[chatHistory.length - 2];
            if (lastUserMessage) {
                const typingIndicator = showTypingIndicator();
                setTimeout(() => {
                    typingIndicator.remove();
                    const botResponse = getBotResponse(lastUserMessage.content);
                    streamResponse(botResponse);
                    chatHistory[chatHistory.length - 1] = { role: 'assistant', content: botResponse };
                }, 800);
            }
        };
        
        const copyButton = document.createElement('button');
        copyButton.className = 'action-button copy';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy message';
        copyButton.onclick = async () => {
            try {
                await navigator.clipboard.writeText(message);
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
                showNotification('Message copied to clipboard', 'success');
            } catch (err) {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy message', 'error');
            }
        };
        
        actionButtons.appendChild(regenerateButton);
        actionButtons.appendChild(copyButton);
        messageBody.appendChild(actionButtons);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageBody);
    
    // Add message to the group, not directly to chatBox
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(20px)';
    messageGroup.appendChild(messageDiv);
    
    // Update timestamp on the group
    messageGroup.setAttribute('data-timestamp', Date.now());
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 50);
    
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Show suggested prompts after bot messages (with delay)
    if (sender === 'bot') {
        setTimeout(() => {
            showSuggestedPrompts();
            removeTypingEffects();
        }, 1500);
    }
    
    return messageDiv;
}

// Enhanced streaming response with better animations and context awareness
async function streamResponse(message, isContextAware = false) {
    const messageDiv = appendMessage('bot', '', isContextAware);
    const content = messageDiv.querySelector('.message-content');
    content.innerHTML = '';
    
    // For markdown content, preprocess to detect code blocks
    const hasMarkdown = message.includes('```') || message.includes('*') || message.includes('#') || message.includes('|');
    const hasMathOrCode = message.includes('```') || message.includes('$');
    
    // Tokenize more intelligently - by characters for code blocks, by words for regular text
    let tokens = [];
    
    if (hasMathOrCode) {
        // More careful handling of code blocks and math expressions
        let inCodeBlock = false;
        let inMathBlock = false;
        let currentBuffer = '';
        const lines = message.split('\n');
        
        for (const line of lines) {
            if (line.includes('```')) {
                // Handle code block boundaries specially
                inCodeBlock = !inCodeBlock;
                tokens.push(currentBuffer + '\n' + line);
                currentBuffer = '';
                continue;
            }
            
            if (inCodeBlock) {
                // Add code lines as whole units for better rendering
                tokens.push(currentBuffer + '\n' + line);
                currentBuffer = '';
            } else {
                // Process regular text by words
                const words = line.split(' ');
                for (const word of words) {
                    tokens.push(currentBuffer + (currentBuffer ? ' ' : '') + word);
                    currentBuffer = '';
                }
                tokens.push('\n'); // Keep line breaks
            }
        }
    } else {
        // For regular text, split by words but preserve punctuation
        const words = message.split(/\b/);
        let currentBuffer = '';
        
        for (const word of words) {
            // Group small chunks together for smoother animation
            if ((currentBuffer + word).length < 10 && !word.includes('\n')) {
                currentBuffer += word;
            } else {
                tokens.push(currentBuffer + word);
                currentBuffer = '';
            }
        }
        
        if (currentBuffer) {
            tokens.push(currentBuffer);
        }
    }
    
    let displayedText = '';
    let cursor = '<span class="ai-cursor">▊</span>';
    
    // Dynamic typing speed based on content
    const baseDelay = hasMarkdown ? 15 : 20;
    const variability = hasMarkdown ? 10 : 25;
    
    for (let i = 0; i < tokens.length; i++) {
        // Skip empty tokens
        if (!tokens[i] && tokens[i] !== '\n') continue;
        
        displayedText += tokens[i];
        
        // For markdown content, we need to parse it properly
        if (hasMarkdown) {
            content.innerHTML = marked.parse(displayedText) + cursor;
        } else {
            content.textContent = displayedText;
            content.innerHTML += cursor;
        }
        
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Variable delay for more natural typing rhythm
        const delay = baseDelay + Math.random() * variability;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Final render without cursor
    if (hasMarkdown) {
        content.innerHTML = marked.parse(message);
        // Re-highlight code blocks
        setTimeout(() => {
            messageDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
            addCopyButtons();
        }, 100);
    } else {
        content.textContent = message;
    }
    
    // Add a subtle "complete" animation
    messageDiv.classList.add('response-complete');
}

// Enhanced theme setup
function setupTheme() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update theme toggle button
    updateThemeToggle(savedTheme);
}

// Update theme toggle button appearance
function updateThemeToggle(theme) {
    const toggle = document.querySelector('.theme-toggle i');
    if (toggle) {
        toggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Enhanced theme toggle function
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Add transition class for smooth theme change
    html.classList.add('theme-transition');
    html.setAttribute('data-theme', newTheme);
    
    // Update theme toggle button
    updateThemeToggle(newTheme);
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
    
    // Remove transition class after animation
    setTimeout(() => {
        html.classList.remove('theme-transition');
    }, 300);
    
    // Show feedback
    showNotification(`Switched to ${newTheme} mode`, 'success');
}

// Make toggleTheme globally available
window.toggleTheme = toggleTheme;
window.clearChat = clearChat;
window.exportChat = exportChat;
window.usePrompt = usePrompt;
window.startNewSession = startNewSession;

// Start a new session with context
function startNewSession() {
    console.log('🔄 Starting new session...');
    console.log('Current chat history length:', chatHistory.length);
    
    // Prepare context from current chat history
    const context = chatHistory.map(entry => `${entry.role === 'user' ? 'Human' : 'Assistant'}: ${entry.content}`).join('\n');
    
    // Store context for the next API call
    sessionContext = context;
    
    console.log('Session context prepared (length:', context.length, 'chars)');
    console.log('Session context preview:', context.substring(0, 200) + '...');
    
    // Clear current chat
    chatHistory = [];
    chatBox.innerHTML = '';
    showWelcomeMessage();
    isFirstMessage = true;
    
    console.log('✅ New session started with context preserved');
    showNotification(`New session started with ${sessionContext.length} characters of context`, 'success');
}

// Test API connection
async function testApiConnection() {
    console.log('============== API CONNECTION TEST START ==============');
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('status-text');
    const reconnectBtn = document.getElementById('reconnect-btn');
    const connectionDots = document.querySelector('.connection-dots');
    
    console.log('UI Elements found:', {
        statusIndicator: !!statusIndicator,
        statusText: !!statusText,
        reconnectBtn: !!reconnectBtn,
        connectionDots: !!connectionDots
    });
    
    if (!statusIndicator || !statusText) {
        console.error('Missing required UI elements for API status');
        return;
    }
    
    // Show connecting state
    statusIndicator.className = 'status-indicator connecting';
    statusText.textContent = 'Connecting to API';
    if (connectionDots) connectionDots.style.display = 'flex';
    if (reconnectBtn) reconnectBtn.style.display = 'none';
    console.log('UI updated to connecting state');
    
    try {
        // Test connection through proxy server to avoid CORS
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // No Authorization header - the proxy will add it
            },
            body: JSON.stringify({
                inputs: {
                    input_0: "hi"
                }
            })
        };
        
        console.log('API Request prepared:', {
            url: API_URL,
            method: options.method,
            headers: { 
                'Content-Type': options.headers['Content-Type']
            },
            bodyString: options.body,
            bodyParsed: JSON.parse(options.body)
        });
        
        console.log('Sending fetch request to proxy server...');
        const response = await fetch(API_URL, options);
        
        console.log('Response received from API:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries([...response.headers]),
        });
            
        if (response.ok) {
            const responseText = await response.text();
            console.log('Raw API response text:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('API test response parsed:', data);
            } catch (parseError) {
                console.error('Failed to parse API response as JSON:', parseError);
                throw new Error(`Failed to parse API response: ${parseError.message}`);
            }
            
            // Connected successfully
            isApiConnected = true;
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'API Connected';
            if (connectionDots) connectionDots.style.display = 'none';
            if (reconnectBtn) reconnectBtn.style.display = 'none';
            showNotification('Connected to API successfully', 'success');
            console.log('API connected successfully, UI updated');
        } else {
            console.error('API request failed with status:', response.status);
            const errorText = await response.text();
            console.error('API error response body:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
        }
    } catch (error) {
        console.error('API connection test failed:', error);
        console.error('Error stack:', error.stack);
        
        // Failed to connect
        isApiConnected = false;
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'API Disconnected (using local mode)';
        if (connectionDots) connectionDots.style.display = 'none';
        if (reconnectBtn) reconnectBtn.style.display = 'inline-flex';
        
        showNotification('Could not connect to API. Using local responses.', 'warning');
    }
    console.log('============== API CONNECTION TEST END ==============');
}

// Get bot response - use API with fallback to local responses
async function getBotResponse(input) {
    console.log('========== getBotResponse called ==========');
    console.log('User input:', input);
    console.log('API connection status:', isApiConnected ? 'CONNECTED' : 'DISCONNECTED');
    
    if (isApiConnected) {
        // Try to use the API first
        try {
            console.log('🌐 Attempting to use VectorShift API for response');
            const startTime = performance.now();
            const response = await fetchApiResponse(input);
            const endTime = performance.now();
            console.log(`✅ VectorShift API response received in ${Math.round(endTime - startTime)}ms`);
            console.log('API response preview:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
            return response;
        } catch (error) {
            console.error('❌ API request failed:', error);
            console.log('⚠️ Falling back to local response system');
            const localResponse = getLocalResponse(input);
            console.log('Local response preview:', localResponse.substring(0, 100) + (localResponse.length > 100 ? '...' : ''));
            return localResponse;
        }
    } else {
        // API is not connected, use local response
        console.log('📝 API not connected, using local response system');
        const localResponse = getLocalResponse(input);
        console.log('Local response preview:', localResponse.substring(0, 100) + (localResponse.length > 100 ? '...' : ''));
        return localResponse;
    }
}

// Function to fetch response from API
async function fetchApiResponse(input) {
    const statusIndicator = document.querySelector('.status-indicator');
    
    if (statusIndicator) {
        statusIndicator.classList.add('thinking');
    }
    
    // Build context from current chat history and session context
    let contextString = '';
    
    // Add session context if available (from previous sessions)
    if (sessionContext) {
        contextString += sessionContext + '\n\n';
    }
    
    // Add recent chat history for context (last 10 messages to avoid token limits)
    const recentHistory = chatHistory.slice(-10);
    if (recentHistory.length > 0) {
        contextString += 'Recent conversation:\n';
        contextString += recentHistory.map(entry => 
            `${entry.role === 'user' ? 'Human' : 'Assistant'}: ${entry.content}`
        ).join('\n') + '\n\n';
    }
    
    contextString += `Current question: ${input}`;
    
    // Using exact format but through our proxy to avoid CORS issues
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // No Authorization header here - our proxy will add it
        },
        body: JSON.stringify({
            inputs: {
                input_0: input,
                context: contextString.trim() // Include session context and chat history
            }
        })
    };

    // Log the outgoing request for debugging
    console.log('API Request:', {
        url: API_URL,
        method: options.method,
        headers: options.headers,
        body: JSON.parse(options.body),
        contextLength: contextString.length
    });

    try {
        // Use proxy URL to avoid CORS issues
        console.log('Sending fetch request to proxy server...');
        const response = await fetch(API_URL, options);
        
        console.log('Response received from API. Status:', response.status);
        
        if (!response.ok) {
            const responseText = await response.text();
            console.error('API error response:', responseText);
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${responseText}`);
        }
        
        const data = await response.json();
        console.log('API response parsed successfully:', data);
        
        if (data.outputs && data.outputs.output_0) {
            console.log('Valid response format, returning output');
            return data.outputs.output_0;
        } else {
            console.error('Invalid response format:', data);
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        // Log the error but keep API connected status
        console.error('API error:', error);
        console.error('API error stack:', error.stack);
        console.error('API request options:', {
            url: 'https://api.vectorshift.ai/v1/pipeline/68334de260a135dd6c5c1d84/run',
            method: options.method,
            headers: { ...options.headers, Authorization: '***REDACTED***' },
            body: JSON.parse(options.body)
        });
        
        // Show notification but don't change the connection status
        showNotification('API request issue, but staying in API mode', 'warning');
        
        // Return a generic response instead of throwing error
        return "I'm sorry, there was a problem processing your request. Please try again.";
    } finally {
        if (statusIndicator) {
            statusIndicator.classList.remove('thinking');
        }
    }
}

// Local fallback responses
function getLocalResponse(input) {
    const responses = {
        "hai": "👋 Hello! I'm here to help. What can I assist you with today?",
        "hello": "👋 Hi there! How can I make your day better?",
        "how are you": "I'm functioning perfectly and ready to assist you! How are you doing today?",
        "bye": "👋 Goodbye! Thanks for chatting with me. Have a wonderful day!",
        "thank you": "You're welcome! 😊 Let me know if you need anything else!",
        "what can you do": `I'm your AI assistant, and I can help you with various tasks:

### Areas of Expertise
- ✨ **General Questions & Information**
- 💡 **Brainstorming & Ideation**
- 📝 **Writing & Content Creation**
- 🤔 **Problem Solving & Analysis**
- 💻 **Basic Programming Help**

### Code Examples
I can provide code snippets like this:
\`\`\`javascript
// A simple function example
function greet(name) {
    return \`Hello, \${name}! Welcome to our chat.\`;
}
\`\`\`

### Quick Tips
> While I work offline and have some limitations, I'll do my best to provide accurate and helpful information.

Need help getting started? Just ask me anything!`,
        "how do I get started":"Simply ask me a question or tell me what you need help with!",
        "can you help me with homework":"Absolutely! Just tell me the subject and what you need help with.", 
        "tell me a joke":"Why did the scarecrow win an award? Because he was outstanding in his field!",
        "tell me a another joke":"Why did the bicycle fall over? because it was two-tired",
        "what is your favorite movie":"I don’t watch movies, but I can recommend popular ones based on your preferences!",
        "how do I contact customer support":"You can reach customer support at: adhiranand26@gmail.com",
        "can you tell me a fun fact":"Did you know honey never spoils? Archaeologists have found pots of honey in ancient tombs that are over 3000 years old!",
        "what’s the weather like today":"I can’t check real-time weather, but you can look it up online!",
        "what are your hours of operation":"I’m available 24/7 to assist you anytime!",
        "what is your favorite color":"I don’t have personal preferences, but I like all colors equally!",
        "what should i do if I feel stressed":"Try deep breathing, take a walk, or talk to someone about it.",
        "what is ai":"Artificial intelligence is the simulation of human intelligence in machines.",
        "how can i stay motivated":"Set clear goals, celebrate small achievements, and surround yourself with supportive people!",
        "what are some tips for public speaking":"Practice, know your audience, and use visual aids to enhance your presentation",
        "how do i stay organized":"Use a planner, prioritize tasks, and declutter your space regularly.",
        "what’s the meaning of life":"Many say it's about finding happiness and fulfillment, but it varies for everyone!",
        "how do i deal with procrastination":"Break tasks into smaller steps, set deadlines, and eliminate distractions.",
        "how can i save money":"Create a budget, set savings goals, and avoid impulse purchases.",
        "how do i improve my sleep quality":"Establish a bedtime routine, avoid screens before bed, and create a comfortable sleeping environment.",
        "what is mindfulness":"Mindfulness is the practice of being present and fully engaged in the moment",
        "what are the benefits of exercise":"What are the benefits of exercise",
        "can you tell me a riddle":"Sure! What has keys but can’t open locks? (Answer: A piano!)",
        "what’s the difference between weather and climate":"Weather refers to short-term atmospheric conditions, while climate is the average over a longer period",
        "how can i make new friends":"Join clubs, attend events, or take classes in areas that interest you!",
        "what is the importance of gratitude":"Practicing gratitude can enhance your mood and improve overall well-being.",
        "what are some healthy snack options":"Fresh fruits, nuts, yogurt, and veggie sticks are all great choices!",
        "how do i stay informed about current events":"Follow reputable news sources online, listen to podcasts, or read news articles",
        "what should i include in my resume":"Include your contact information, work experience, education, and relevant skills.",
        "how do i manage stress?":"Identify stressors, practice relaxation techniques, and seek support from friends or professionals",
        "what are some popular books to read":"Some popular books include The great Gatsby and to kill a Mockingbird.",
        "how can i relax after a long day":"How can I relax after a long day",
        "can you recommend a workout routine":"A balanced routine includes cardio, strength training, and flexibility exercises. Aim for at least 150 minutes of moderate activity each week!",
        "how can i learn a new language":"You can use language learning apps, take online courses, practice with native speakers, and immerse yourself in the language!",
        "what are some popular travel destinations":"Popular destinations include Paris, Tokyo, New York City, and Bali!",
        "how do i start a garden":"Choose a sunny spot, select your plants, prepare the soil, and water regularly!",
        "how can i improve my public speaking skills":"Practice regularly, know your material, and focus on engaging your audience!",
    };
    const lowerCaseInput = input.toLowerCase();
    return responses[lowerCaseInput] || "Sorry, I don't understand that.Can you elaborate";
}

// Add ripple effect to buttons
function addRippleEffect() {
    const buttons = document.querySelectorAll('.action-btn, .send-btn, .prompt-btn, .suggestion-button, .action-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Return if button is disabled
            if (this.disabled) return;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const diameter = Math.max(rect.width, rect.height);
            const radius = diameter / 2;
            
            ripple.style.width = ripple.style.height = `${diameter}px`;
            ripple.style.left = `${e.clientX - rect.left - radius}px`;
            ripple.style.top = `${e.clientY - rect.top - radius}px`;
            
            setTimeout(() => {
                ripple.remove();
            }, 600); // Match animation duration
        });
    });
}

// Observer for dynamically added buttons
function setupRippleObserver() {
    // Initial setup
    addRippleEffect();
    
    // Create observer for dynamically added buttons
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                // Check if any buttons were added
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const buttons = node.querySelectorAll('.action-btn, .send-btn, .prompt-btn, .suggestion-button, .action-button');
                        if (buttons.length) {
                            buttons.forEach(button => {
                                // Only add listener if it doesn't already have one
                                if (!button.hasAttribute('data-has-ripple')) {
                                    button.setAttribute('data-has-ripple', 'true');
                                    
                                    button.addEventListener('click', function(e) {
                                        if (this.disabled) return;
                                        
                                        const ripple = document.createElement('span');
                                        ripple.classList.add('ripple');
                                        this.appendChild(ripple);
                                        
                                        const rect = this.getBoundingClientRect();
                                        const diameter = Math.max(rect.width, rect.height);
                                        const radius = diameter / 2;
                                        
                                        ripple.style.width = ripple.style.height = `${diameter}px`;
                                        ripple.style.left = `${e.clientX - rect.left - radius}px`;
                                        ripple.style.top = `${e.clientY - rect.top - radius}px`;
                                        
                                        setTimeout(() => {
                                            ripple.remove();
                                        }, 600);
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
}

// Create wavy text animation for welcome message
function createWavyText() {
    const wavyTextContainers = document.querySelectorAll('.wavy-text-container');
    
    wavyTextContainers.forEach(container => {
        const text = container.textContent;
        container.textContent = ''; // Clear the container
        
        // Create spans for each character with staggered animation
        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.setProperty('--i', index);
            span.className = 'wavy-text';
            container.appendChild(span);
        });
    });
}

// Direct test function for VectorShift API through proxy
function testVectorShiftAPI(query = "test hello") {
  console.log("Testing VectorShift API with query:", query);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No Authorization header - the proxy will add it
    },
    body: JSON.stringify({
      inputs: {
        input_0: query
      }
    })
  };

  fetch(API_URL, options)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(response => {
      console.log("VectorShift API Success Response:", response);
      if (response.outputs && response.outputs.output_0) {
        console.log("Output:", response.outputs.output_0);
        // Update API connection status
        isApiConnected = true;
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.getElementById('status-text');
        if (statusIndicator) statusIndicator.className = 'status-indicator online';
        if (statusText) statusText.textContent = 'API Connected';
        showNotification('VectorShift API is working!', 'success');
      }
    })
    .catch(err => {
      console.error("VectorShift API Error:", err);
      // Update API connection status
      isApiConnected = false;
      const statusIndicator = document.querySelector('.status-indicator');
      const statusText = document.getElementById('status-text');
      if (statusIndicator) statusIndicator.className = 'status-indicator offline';
      if (statusText) statusText.textContent = 'API Disconnected (using local mode)';
      showNotification('VectorShift API is not available. Using local responses.', 'warning');
    });
}

// Call the test function when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to let page load first
  setTimeout(() => {
    testVectorShiftAPI();
  }, 1000);
});

// Toggle debug panel visibility
function toggleDebugPanel() {
  // Toggle the _debugVisible flag in the window object
  window._debugVisible = !window._debugVisible;
  
  // Show the visual logger if it exists
  const loggerDiv = document.getElementById('visual-logger');
  if (loggerDiv) {
    loggerDiv.style.display = window._debugVisible ? 'block' : 'none';
    console.log(`Debug panel ${window._debugVisible ? 'shown' : 'hidden'}`);
    showNotification(`Debug mode ${window._debugVisible ? 'activated' : 'deactivated'}`, 'info');
  } else {
    console.error('Debug panel element not found');
    showNotification('Debug panel not initialized yet', 'warning');
  }
}

// Make function globally available
window.toggleDebugPanel = toggleDebugPanel;


