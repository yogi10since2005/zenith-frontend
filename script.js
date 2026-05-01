document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const screenWelcome = document.getElementById('screen-welcome');
    const screenChat = document.getElementById('screen-chat');
    
    const modalSupport = document.getElementById('modal-support');
    const modalRouted = document.getElementById('modal-routed');
    const modalEnd = document.getElementById('modal-end');

    const btnVoiceMode = document.getElementById('btn-voice-mode');
    const btnTextMode = document.getElementById('btn-text-mode');
    const btnRealPersonWelcome = document.getElementById('btn-real-person-welcome');
    const btnRealPersonChat = document.getElementById('btn-real-person-chat');
    
    const btnEndSession = document.getElementById('btn-end-session');
    const btnCloseSupport = document.getElementById('btn-close-support');
    const btnJoinCounsellor = document.getElementById('btn-join-counsellor');
    const btnEndCall = document.getElementById('btn-end-call');
    
    const btnFinalClose = document.getElementById('btn-final-close');
    const btnNewSession = document.getElementById('btn-new-session');

    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');
    const chatMessages = document.getElementById('chat-messages');
    const sessionTimerEl = document.getElementById('session-timer');
    const callTimerEl = document.getElementById('call-timer');

    // State
    let sessionTimer = null;
    let callTimer = null;
    let secondsElapsed = 0;
    let callSecondsElapsed = 0;
    let conversationTurn = 0; // Tracks conversation depth
    let isVoiceMode = false; // Tracks if AI should speak

    // --- Navigation & View Logic ---
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    function showModal(modal) {
        modal.classList.remove('hidden');
    }

    function hideModal(modal) {
        modal.classList.add('hidden');
    }

    function hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }

    // --- Session Logic ---
    function startSession() {
        showScreen(screenChat);
        startTimer();
        conversationTurn = 0; // Reset conversation turn on new session
        // Clear previous messages if any
        const messages = chatMessages.querySelectorAll('.message');
        messages.forEach(m => m.remove());
        chatMessages.querySelector('.first-run-state').style.display = 'flex';
    }

    function endSession() {
        stopTimer();
        showModal(modalEnd);
    }

    function resetApp() {
        hideAllModals();
        showScreen(screenWelcome);
        secondsElapsed = 0;
        sessionTimerEl.textContent = '00:00';
    }

    // --- Timer Logic ---
    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function startTimer() {
        if(sessionTimer) clearInterval(sessionTimer);
        sessionTimer = setInterval(() => {
            secondsElapsed++;
            sessionTimerEl.textContent = formatTime(secondsElapsed);
        }, 1000);
    }

    function stopTimer() {
        if(sessionTimer) clearInterval(sessionTimer);
    }

    function startCallTimer() {
        callSecondsElapsed = 0;
        if(callTimer) clearInterval(callTimer);
        callTimer = setInterval(() => {
            callSecondsElapsed++;
            callTimerEl.textContent = formatTime(callSecondsElapsed);
        }, 1000);
    }

    function stopCallTimer() {
        if(callTimer) clearInterval(callTimer);
    }

    // --- Chat Logic ---
    function addMessage(text, sender) {
        const firstRunState = chatMessages.querySelector('.first-run-state');
        if (firstRunState) {
            firstRunState.style.display = 'none';
        }

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender === 'user' ? 'msg-user' : 'msg-ai');
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Maintain conversation history for the AI
    let conversationHistory = [
        { role: "system", content: "You are Zenith, an empathetic, non-judgmental, and highly supportive mental health AI buddy. Keep responses short (1-2 sentences max), warm, and conversational. Ask open-ended questions. If the user mentions suicide or self-harm, gently encourage them to use the 'Talk to a Real Person' button." }
    ];

    async function getAIResponse(userInput) {
        conversationHistory.push({ role: "user", content: userInput });

        try {
            // Using a free, keyless AI endpoint perfect for frontend prototyping!
            const response = await fetch("https://text.pollinations.ai/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: conversationHistory,
                    model: "openai"
                })
            });

            if (!response.ok) {
                throw new Error("API request failed");
            }

            // The API returns the raw text directly
            const aiMessage = await response.text();
            
            conversationHistory.push({ role: "assistant", content: aiMessage });
            return aiMessage;
        } catch (error) {
            console.error(error);
            return "I'm having a little trouble connecting to my brain right now. Can we try again in a moment?";
        }
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        // User message
        addMessage(text, 'user');
        chatInput.value = '';
        btnSend.disabled = true;

        // Show a typing indicator
        const tempId = "typing-" + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'msg-ai', 'pulse');
        msgDiv.id = tempId;
        msgDiv.textContent = "...";
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Fetch real AI response
        const responseText = await getAIResponse(text);
        
        // Remove typing indicator and add real message
        document.getElementById(tempId).remove();
        addMessage(responseText, 'ai');
        
        // Speak response if voice mode is enabled
        speakText(responseText);
    }

    // --- Speech Synthesis & Recognition ---
    function speakText(text) {
        if (!isVoiceMode || !window.speechSynthesis) return;
        
        window.speechSynthesis.cancel(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a calming voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = 0.95; // Slightly slower
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    // Speech-to-Text (User Dictation)
    const btnToggleMic = document.getElementById('btn-toggle-mic');
    let recognition = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            btnToggleMic.classList.add('pulse');
            btnToggleMic.style.color = 'var(--danger-color)';
            chatInput.placeholder = "Listening...";
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            btnSend.disabled = false;
            // Auto send after speaking
            handleSend();
        };
        
        recognition.onend = () => {
            btnToggleMic.classList.remove('pulse');
            btnToggleMic.style.color = '';
            chatInput.placeholder = "Type or say something…";
        };
    }

    if (btnToggleMic) {
        btnToggleMic.addEventListener('click', () => {
            if (recognition) {
                isVoiceMode = true; // Auto-enable AI voice if user starts talking
                try {
                    recognition.start();
                } catch(e) {
                    recognition.stop();
                }
            } else {
                alert("Speech recognition is not supported in your browser.");
            }
        });
    }

    // --- Event Listeners ---

    // Welcome Screen
    btnVoiceMode.addEventListener('click', () => {
        isVoiceMode = true;
        startSession();
    });
    btnTextMode.addEventListener('click', () => {
        isVoiceMode = false;
        startSession();
    });
    btnRealPersonWelcome.addEventListener('click', () => {
        showModal(modalSupport);
    });

    // Chat Screen
    chatInput.addEventListener('input', () => {
        btnSend.disabled = chatInput.value.trim() === '';
    });
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
    btnSend.addEventListener('click', handleSend);

    btnEndSession.addEventListener('click', endSession);
    btnRealPersonChat.addEventListener('click', () => {
        showModal(modalSupport);
    });

    // Support Modal
    btnCloseSupport.addEventListener('click', () => {
        hideModal(modalSupport);
    });
    btnJoinCounsellor.addEventListener('click', () => {
        hideModal(modalSupport);
        showModal(modalRouted);
        startCallTimer();
    });

    // Call Room Modal
    btnEndCall.addEventListener('click', () => {
        stopCallTimer();
        hideModal(modalRouted);
    });

    // End Session Modal
    btnFinalClose.addEventListener('click', () => {
        window.close(); // Might not work depending on browser security, but standard practice
        resetApp(); 
    });
    btnNewSession.addEventListener('click', () => {
        resetApp();
        startSession();
    });

    // Starter Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.textContent.replace(/"/g, '');
            btnSend.disabled = false;
            handleSend();
        });
    });

    // Mood Buttons
    document.querySelectorAll('.btn-mood').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-mood').forEach(b => b.style.background = 'var(--bg-elevated)');
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
            e.currentTarget.style.borderColor = 'var(--primary-color)';
        });
    });

    // Cursor Glow Tracking
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorGlow.style.left = e.clientX + 'px';
                cursorGlow.style.top = e.clientY + 'px';
            });
        });
    }
});
