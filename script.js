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

    function getAIResponse(userInput) {
        const text = userInput.toLowerCase();
        conversationTurn++;
        
        // Safety/Crisis check
        if (text.match(/(suicide|kill myself|die|end it all|hurt myself|pills)/)) {
            return "I am so sorry you're feeling this much pain. Please know that your life has value. I strongly encourage you to click 'Talk to a Real Person' below or call the helpline. You don't have to carry this alone.";
        }
        
        if (text.match(/(anxious|anxiety|panic|overwhelmed|stress|scared)/)) {
            return "It sounds like you're carrying a lot of weight right now. Can we try taking a slow, deep breath together? What's the main thing making you feel overwhelmed?";
        }
        
        if (text.match(/(sad|depressed|down|crying|hopeless|tired of trying)/)) {
            return "I hear the sadness in your words. It's completely okay to let yourself feel this. How long have things been feeling this heavy for you?";
        }
        
        if (text.match(/(lonely|alone|nobody|isolated|no one)/)) {
            return "Feeling isolated is incredibly difficult. Please know that right now, in this moment, you are heard. I'm here. Do you want to talk about what's making you feel alone?";
        }

        if (text.match(/(angry|mad|frustrated|annoyed|hate)/)) {
            return "It's totally valid to feel frustrated about that. Anger can be really exhausting to hold onto. Do you want to vent more about what happened?";
        }

        if (text.match(/(hello|hi|hey)/) && text.length < 15) {
            return "Hi there. I'm glad you reached out. What's on your mind today?";
        }

        // Sequential generic responses if no keywords hit
        if (conversationTurn === 1) {
            return "Thank you for sharing that with me. It takes courage to open up. Could you tell me a bit more about how that makes you feel?";
        } else if (conversationTurn === 2) {
            return "I see. It makes a lot of sense that you'd feel that way given the situation. How have you been coping with this lately?";
        } else if (conversationTurn === 3) {
            return "That sounds exhausting. Please remember to be gentle with yourself. You're doing the best you can. What do you feel like you need most right now?";
        } else {
            const generic = [
                "I'm listening. Please go on.",
                "That's a very valid way to feel. Tell me more.",
                "I'm here for you. Take all the time you need.",
                "It's okay to let it all out. I'm not judging you."
            ];
            return generic[Math.floor(Math.random() * generic.length)];
        }
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        // User message
        addMessage(text, 'user');
        chatInput.value = '';
        btnSend.disabled = true;

        // Mock AI response
        setTimeout(() => {
            const response = getAIResponse(text);
            addMessage(response, 'ai');
        }, 1500 + Math.random() * 1000); // Add a slight random delay for realism
    }

    // --- Event Listeners ---

    // Welcome Screen
    btnVoiceMode.addEventListener('click', startSession);
    btnTextMode.addEventListener('click', startSession);
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
});
