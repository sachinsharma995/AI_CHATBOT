window.onerror = function(msg, url, line) {
    alert("JS Error: " + msg + " @ " + line);
};


// --- Global Configuration ---
const API_URL = "https://ai-chatbot-backend-1-m1vw.onrender.com/chat";

const messagesContainer = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
let isFetching = false;

// Chat history stored locally for context
let chatHistory = [];


// --- SAFE JSON PARSE FUNCTION ---
async function safeJSON(response) {
    try {
        return await response.json();
    } catch (e) {
        return null; // backend returned HTML or empty body
    }
}


// --- Exponential Backoff but SLOWER for Render (IMPORTANT) ---
async function exponentialBackoffFetch(url, options, maxRetries = 5) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // If backend is up & returns valid response
            if (response.ok) return response;

            // If backend is waking up (Render FREE servers)
            const delay = 5000 * (attempt + 1); // 5s, 10s, 15s, 20s...
            console.log(`Backend waking up... retrying in ${delay / 1000}s`);

            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            if (attempt === maxRetries - 1) {
                throw new Error(
                    `Unable to reach backend after ${maxRetries} attempts.`
                );
            }
        }
    }
}



// --- Display Message in Chat UI ---
function displayMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message-row", sender === "user" ? "user-row" : "bot-row");

    const bubble = document.createElement("div");
    bubble.classList.add(
        "message-bubble",
        sender === "user" ? "user-message" : "bot-message",
        "shadow-md"
    );

    const formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");

    bubble.innerHTML = formattedText;
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}



// --- Loading Animation ---
let loadingElement = null;

function toggleLoading(show) {
    if (show) {
        const loadingContainer = document.createElement("div");
        loadingContainer.classList.add("message-row", "bot-row");

        loadingElement = document.createElement("div");
        loadingElement.classList.add("message-bubble", "bot-message", "shadow-md");

        loadingElement.innerHTML = `
            <span>Typing</span>
            <span class="loading-indicator"></span>
            <span class="loading-indicator"></span>
            <span class="loading-indicator"></span>
        `;

        loadingContainer.appendChild(loadingElement);
        messagesContainer.appendChild(loadingContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        if (loadingElement) loadingElement.parentElement.remove();
        loadingElement = null;
    }

    sendButton.disabled = show;
    userInput.disabled = show;
    isFetching = show;
    sendButton.textContent = show ? "Wait..." : "Send";
}



// --- Main Logic: Calling Backend ---
async function callGeminiAPI(userQuery) {
    toggleLoading(true);

    const historyPayload = chatHistory.map(msg => ({
        role: msg.role,
        parts: msg.parts
    }));

    const payload = {
        message: userQuery,
        history: historyPayload
    };

    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    };

    try {
        const response = await exponentialBackoffFetch(API_URL, options);
        const result = await safeJSON(response);

        if (!result || !result.response) {
            displayMessage(
                "Server is waking up... please try again in a moment.",
                "bot"
            );
            return;
        }

        const botText = result.response;

        chatHistory.push({ role: "user", parts: [{ text: userQuery }] });
        chatHistory.push({ role: "model", parts: [{ text: botText }] });

        displayMessage(botText, "bot");

    } catch (error) {
        displayMessage(`❌ Error: ${error.message}`, "bot");
    } finally {
        toggleLoading(false);
    }
}



// --- Event Listener ---
chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isFetching) return;

    const userQuery = userInput.value.trim();
    if (userQuery === "") return;

    displayMessage(userQuery, "user");
    userInput.value = "";

    callGeminiAPI(userQuery);
});
