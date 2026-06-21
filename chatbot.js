// ==========================
// SMART ASSISTANT LOGIC
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const chatWidget = document.getElementById('chatWidget');
    const chatIcon = document.getElementById('chatIcon');
    const chatBody = document.getElementById('chatBody');
    const chatInput = document.getElementById('chatInput');

    window.toggleChat = function (e) {
        if (e) e.stopPropagation();
        if (!chatWidget) return;
        chatWidget.classList.toggle('collapsed');
    };

    // Close when clicking outside
    document.addEventListener('click', function (e) {
        if (chatWidget && !chatWidget.classList.contains('collapsed')) {
            const chatFab = document.getElementById('chatFab');
            // If click is not inside widget and not on fab
            if (!chatWidget.contains(e.target) && (!chatFab || !chatFab.contains(e.target))) {
                chatWidget.classList.add('collapsed');
            }
        }
    });

    // Start collapsed by default
    if (chatWidget) {
        chatWidget.classList.add('collapsed');
    }

    window.handleChat = function (e) {
        if (e.key === 'Enter') window.sendChat();
    };

    window.sendChat = function () {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message
        addMsg(text, 'user-msg');
        chatInput.value = '';

        // Smart Logic Reply
        setTimeout(() => {
            const lower = text.toLowerCase();
            let reply = "I'm not sure about that. Try asking about 'donate', 'volunteer', 'eco-friendly', or 'contact'.";

            if (lower.includes('donate') || lower.includes('food') || lower.includes('clothes')) {
                reply = "You can donate food, clothes, and more on our Donation page! <a href='donate.html' style='color:#115a25; font-weight:bold;'>Go to Donate</a>";
            } else if (lower.includes('volunteer') || lower.includes('ngo') || lower.includes('team')) {
                reply = "Join forces! Register your volunteer team or NGO on our About page. <a href='About.html#register-section' style='color:#115a25; font-weight:bold;'>Register Here</a>";
            } else if (lower.includes('eco') || lower.includes('buy') || lower.includes('shop')) {
                reply = "Check out our Ecofriendly Items section to buy sustainable products! <a href='Ecofriendly.html' style='color:#115a25; font-weight:bold;'>Shop Eco</a>";
            } else if (lower.includes('renew') || lower.includes('recycle')) {
                reply = "We partner with startups to recycle waste. See how we do it on the Renew page. <a href='renew.html' style='color:#115a25; font-weight:bold;'>Learn More</a>";
            } else if (lower.includes('hello') || lower.includes('hi')) {
                reply = "Hello! How can I help you save nature today?";
            }

            addMsg(reply, 'bot-msg');
        }, 500);
    };

    function addMsg(text, className) {
        if (!chatBody) return;
        const div = document.createElement('div');
        div.className = className;
        if (className === 'user-msg') {
            div.textContent = text;
        } else {
            div.innerHTML = text;
        }
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});
