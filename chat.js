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

// Login & Greeting Logic
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const sidebarGreeting = document.getElementById('sidebar-greeting');

let storedName = localStorage.getItem('ojas_username');
if (storedName) {
    loginOverlay.classList.add('hidden');
    sidebarGreeting.textContent = `Welcome, ${storedName}`;
}

if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = usernameInput.value.trim();
        if (name) {
            localStorage.setItem('ojas_username', name);
            sidebarGreeting.textContent = `Welcome, ${name}`;
            loginOverlay.classList.remove('hidden'); // Need this to reset state before hiding
            setTimeout(() => {
                loginOverlay.classList.add('hidden');
            }, 50);
        }
    });
}

const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('ojas_username');
        loginOverlay.classList.remove('hidden');
        usernameInput.value = '';
    });
}

let messageHistory = [];
let currentModel = 'llama3-8b-8192'; // Default
let currentPersona = 'ojas'; // Default

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
