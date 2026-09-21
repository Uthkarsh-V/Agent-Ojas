const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('agent-status-text');

// Menu Elements
const attachBtn = document.getElementById('attach-btn');
const attachmentMenu = document.getElementById('attachment-menu');
const modelSelectorBtn = document.getElementById('model-selector-btn');
const modelMenu = document.getElementById('model-menu');
const modelOptions = document.querySelectorAll('.model-option');

const roleSelectorBtn = document.getElementById('role-selector-btn');
const roleMenu = document.getElementById('role-menu');
const roleOptions = document.querySelectorAll('.role-option');

const quickBtns = document.querySelectorAll('.quick-btn');

// ==========================================
// Authentication & Routing Logic
// ==========================================
const loginOverlay = document.getElementById('login-overlay');
const sidebarGreeting = document.getElementById('sidebar-greeting');
const googleLoginBtn = document.getElementById('google-login-btn');
const githubLoginBtn = document.getElementById('github-login-btn');
const authLoading = document.getElementById('auth-loading');
const authErrorMsg = document.getElementById('auth-error-msg');
const logoutBtn = document.getElementById('logout-btn');
const newChatBtn = document.getElementById('new-chat-btn');

let messageHistory = [];
let currentModel = 'llama3-8b-8192'; // Default
let currentPersona = 'ojas'; // Default

// 1. Fetch Firebase Config securely from Flask backend
async function initFirebase() {
    try {
        const response = await fetch('/api/firebase-config');
        const config = await response.json();
        
        if (!config.apiKey || config.apiKey === "") {
            authErrorMsg.textContent = "Developer Error: Firebase API Keys are missing from the server's .env file. Please add them to enable OAuth.";
            authErrorMsg.style.display = 'block';
            return;
        }

        const app = window.firebaseAppInit(config);
        const auth = window.firebaseAuth.getAuth(app);

        // 2. Handle Auth State Changes
        window.firebaseAuth.onAuthStateChanged(auth, (user) => {
            if (user) {
                loginOverlay.classList.add('hidden');
                sidebarGreeting.textContent = `Welcome, ${user.displayName || user.email.split('@')[0]}`;
            } else {
                loginOverlay.classList.remove('hidden');
                sidebarGreeting.textContent = `Ojas Hub`;
            }
            authLoading.style.display = 'none';
        });

        // 3. Login Handlers
        const handleLogin = async (provider) => {
            authLoading.style.display = 'block';
            authErrorMsg.style.display = 'none';
            try {
                await window.firebaseAuth.signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Auth error:", error);
                authErrorMsg.textContent = error.message;
                authErrorMsg.style.display = 'block';
                authLoading.style.display = 'none';
            }
        };

        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => handleLogin(new window.firebaseAuth.GoogleAuthProvider()));
        }
        if (githubLoginBtn) {
            githubLoginBtn.addEventListener('click', () => handleLogin(new window.firebaseAuth.GithubAuthProvider()));
        }

        // 4. Logout Handler
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.firebaseAuth.signOut(auth);
            });
        }
    } catch (err) {
        console.error("Failed to initialize Firebase:", err);
    }
}

// Start Firebase Auth Flow
initFirebase();

// 5. New Chat Handler
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        // Clear message history array (wipes AI memory)
        messageHistory = [];
        
        // Clear DOM and reset greeting
        chatMessages.innerHTML = `
            <div class="message ai-message initial">
                <div class="message-content">
                    Core systems online. Memory cleared. Awaiting new input sequence...
                </div>
            </div>
        `;
    });
}

// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Toggle Menus
attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modelMenu.classList.add('hidden');
    roleMenu.classList.add('hidden');
    attachmentMenu.classList.toggle('hidden');
});

modelSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachmentMenu.classList.add('hidden');
    roleMenu.classList.add('hidden');
    modelMenu.classList.toggle('hidden');
});

roleSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachmentMenu.classList.add('hidden');
    modelMenu.classList.add('hidden');
    roleMenu.classList.toggle('hidden');
});

// Select Custom Model
modelOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        modelOptions.forEach(opt => opt.classList.remove('active-model'));
        option.classList.add('active-model');
        currentModel = option.getAttribute('data-model');
        const modelName = option.innerText;
        modelSelectorBtn.innerHTML = `${modelName} <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        modelMenu.classList.add('hidden');
    });
});

// Select Custom Role (Persona)
roleOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        roleOptions.forEach(opt => opt.classList.remove('active-model'));
        option.classList.add('active-model');
        currentPersona = option.getAttribute('data-role');
        const roleName = option.innerText;
        roleSelectorBtn.innerText = roleName;
        roleMenu.classList.add('hidden');
        
        // System Notification
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai-message initial';
        msgDiv.innerHTML = `<div class="message-content" style="border-color: #00f2fe; color: #00f2fe; font-size: 0.85rem; padding: 8px 14px;">Expertise shifted to: ${roleName}</div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
});

// Close menus if clicking outside
document.addEventListener('click', (e) => {
    if (!attachmentMenu.contains(e.target) && !attachBtn.contains(e.target)) {
        attachmentMenu.classList.add('hidden');
    }
    if (!modelMenu.contains(e.target) && !modelSelectorBtn.contains(e.target)) {
        modelMenu.classList.add('hidden');
    }
    if (!roleMenu.contains(e.target) && !roleSelectorBtn.contains(e.target)) {
        roleMenu.classList.add('hidden');
    }
});

// Quick Action Buttons
quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const promptText = btn.getAttribute('data-prompt');
        chatInput.value = promptText;
        chatInput.focus();
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });
});


function addMessageToUI(content, isUser, isThinking = false, usedTools = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    if (isThinking) msgDiv.classList.add('thinking');
    if (usedTools) msgDiv.classList.add('tool-used');
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

function updateThinkingMessage(msgElement, finalContent, usedTools) {
    msgElement.classList.remove('thinking');
    if (usedTools) msgElement.classList.add('tool-used');
    msgElement.querySelector('.message-content').textContent = finalContent;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setAgentState(state) {
    if (state === 'thinking') {
        document.body.classList.add('state-thinking');
        statusText.textContent = 'Processing';
    } else {
        document.body.classList.remove('state-thinking');
        statusText.textContent = 'Idle';
    }
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessageToUI(text, true);
    messageHistory.push({ role: 'user', content: text });
    
    chatInput.value = '';
    chatInput.style.height = 'auto';

    setAgentState('thinking');
    const thinkingMsgEle = addMessageToUI('Analyzing...', false, true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: messageHistory,
                model: currentModel,
                persona: currentPersona
            })
        });

        const data = await response.json();

        if (data.error) {
            updateThinkingMessage(thinkingMsgEle, `System Error: ${data.error}`, false);
        } else {
            updateThinkingMessage(thinkingMsgEle, data.content, data.used_tools);
            messageHistory.push({ role: 'assistant', content: data.content });
        }
    } catch (error) {
        updateThinkingMessage(thinkingMsgEle, `Connection Failure. Ensure server is running.`, false);
    } finally {
        setAgentState('idle');
    }
}

sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
