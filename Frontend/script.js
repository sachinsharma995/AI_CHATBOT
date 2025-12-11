// --- Global Configuration ---
// Now points to your local Flask server endpoint
const API_URL = `const API_URL = "https://ai-chatbot-backend-1-m1vw.onrender.com/chat";`; 
const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
let isFetching = false;
// chatHistory will now be sent to the Flask server
let chatHistory = []; 

// System instruction is now handled by the Flask backend (app.py), but we keep the structure 
// for the client side to manage conversation state clearly.

// --- Utility Functions ---

// 1. Exponential Backoff for API calls
// NOTE: This function is simplified since the Flask server should handle retries, 
// but we keep it to manage potential connection issues to the Flask server itself.
async function exponentialBackoffFetch(url, options, maxRetries = 5) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }
            // For connection issues to Flask (not 429 errors from Google)
            if (response.status >= 500 && attempt < maxRetries - 1) { 
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // If Flask returns an error (400, 500, etc.), throw it
                const errorBody = await response.json();
                throw new Error(`Server returned status ${response.status}: ${errorBody.error || response.statusText}`);
            }
        } catch (error) {
            if (attempt === maxRetries - 1) {
                throw new Error(`Fetch failed after ${maxRetries} attempts: ${error.message}`);
            }
        }
    }
}

// 2. Display Message in UI
function displayMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message-row', sender === 'user' ? 'user-row' : 'bot-row');

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble', sender === 'user' ? 'user-message' : 'bot-message', 'shadow-md');
    
    // Use innerHTML to correctly render Markdown (basic handling)
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    bubble.innerHTML = formattedText;
    
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 3. Add/Remove Loading Indicator
let loadingElement = null;
function toggleLoading(show) {
    if (show) {
        const loadingContainer = document.createElement('div');
        loadingContainer.classList.add('message-row', 'bot-row');
        loadingElement = document.createElement('div');
        loadingElement.classList.add('message-bubble', 'bot-message', 'shadow-md');
        
        loadingElement.innerHTML = `
            <span>Typing</span>
            <span class="loading-indicator"></span>
            <span class="loading-indicator"></span>
            <span class="loading-indicator"></span>
        `;
        loadingContainer.appendChild(loadingElement);
        messagesContainer.appendChild(loadingContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else if (loadingElement) {
        loadingElement.parentElement.remove();
        loadingElement = null;
    }
    sendButton.disabled = show;
    userInput.disabled = show;
    isFetching = show;
    sendButton.textContent = show ? 'Wait...' : 'Send'; 
}

// --- Main Logic (The Core) ---

async function callGeminiAPI(userQuery) {
    toggleLoading(true);

    // Prepare history to send to Flask
    const historyPayload = chatHistory.map(msg => ({ 
        role: msg.role, 
        parts: msg.parts 
    }));
    
    const payload = {
        message: userQuery,
        history: historyPayload
    };

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };

    try {
        const response = await exponentialBackoffFetch(API_URL, options);
        const result = await response.json();
        
        const botText = result.response;

        if (botText) {
            // Add both user message and bot response to client-side history
            chatHistory.push({ role: "user", parts: [{ text: userQuery }] });
            chatHistory.push({ role: "model", parts: [{ text: botText }] });
            displayMessage(botText, 'bot');
        } else {
            displayMessage("Sorry, I couldn't get a proper response right now. Please check your Flask server logs.", 'bot');
        }
    } catch (error) {
        console.error("API Error:", error);
        displayMessage(`Oops! Could not connect to Flask server. Error: ${error.message}`, 'bot');
    } finally {
        toggleLoading(false);
    }
}

// --- Event Listener ---
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (isFetching) return;

    const userQuery = userInput.value.trim();
    if (userQuery === "") return;

    // Display user message immediately (we will add it to chatHistory inside callGeminiAPI)
    displayMessage(userQuery, 'user');
    userInput.value = '';

    callGeminiAPI(userQuery);
});
