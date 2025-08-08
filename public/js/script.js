document.addEventListener('DOMContentLoaded', () => {
    // Listen for portfolio analyzer replies and display in chat
    window.addEventListener("newChatbotReply", (e) => {
        const message = e.detail;
        if (!message) return;

        const chatBox = document.getElementById("chatBox");
        const chatArea = document.getElementById("chatArea");
        const chatMessages = document.getElementById("chatMessages");
        const header = document.getElementById("header");
        const prompt = document.getElementById("prompt");

        chatBox.classList.add("active");
        chatArea.classList.add("active");
        chatMessages.classList.add("active");

        if (header) header.remove();
        if (prompt) prompt.remove();

        const div = document.createElement("div");
        div.className = "message bot-message";
        div.innerHTML = formatResponseText(message); // ensure formatting is used
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    const toggleBtn = document.getElementById('toggleBtn');
    const searchBtn = document.getElementById('searchBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const authButton = document.getElementById('authButton');
    const settingsBtn = document.getElementById('settingsBtn');
    const themeToggle = document.getElementById('themeToggle');
    const dropdown = document.getElementById('dropdown');
    const sidebar = document.getElementById('sidebar');
    const themeText = document.getElementById('themeText');
    const themeIcon = document.getElementById('themeIcon');

    const header = document.getElementById('header');
    const prompt = document.getElementById('prompt');

    toggleBtn.addEventListener('click', toggleSidebar);
    settingsBtn.addEventListener('click', toggleDropdown);
    authButton.addEventListener('click', toggleAuthState);
    themeToggle.addEventListener('click', toggleTheme);

    // Sidebar Toggle
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('closed');
    }

    // Dropdown Toggle
    function toggleDropdown() {
        const dropdown = document.getElementById('dropdown');
        dropdown.classList.toggle('active');
    }

    // Theme Toggle
    function toggleTheme() {
        const isLightMode = document.body.classList.toggle('light-mode');
        document.getElementById('themeText').textContent = isLightMode ? 'Dark' : 'Light';
        document.getElementById('themeIcon').className = isLightMode ? 'fas fa-moon' : 'fas fa-sun';
        document.getElementById('sidebar').classList.toggle('light-mode', isLightMode);
        
        document.querySelectorAll('.bot-message').forEach(botMsg => {
            botMsg.classList.toggle('light-mode', isLightMode);
        });

        // Store the theme preference
        localStorage.setItem('theme', isLightMode ? 'light-mode' : 'dark-mode');
    }

    // Apply stored theme on page load
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light-mode') {
        document.body.classList.add('light-mode');
        document.getElementById('sidebar').classList.add('light-mode');
        document.getElementById('themeText').textContent = 'Dark';
        document.getElementById('themeIcon').className = 'fas fa-moon';
    }

    // Close dropdown when clicking outside or when sidebar is closed
    document.addEventListener('click', (event) => {
        const dropdown = document.getElementById('dropdown');
        if (!dropdown.contains(event.target) && !event.target.matches('.settings-btn')) {
            dropdown.classList.remove('active');
        }
    });

    document.getElementById('sidebar').addEventListener('transitionend', () => {
        const dropdown = document.getElementById('dropdown');
        if (dropdown && document.getElementById('sidebar').classList.contains('closed')) {
            dropdown.classList.remove('active');
        }
    });

    // Optimized Auth State Toggle
    async function toggleAuthState() {
        const authButton = document.getElementById("authButton");
        const authText = document.getElementById("authText");
        const authIcon = document.getElementById("authIcon");
        // const usernameDisplay = document.getElementById("usernameDisplay");

        try {
            const response = await fetch("/api/user", { credentials: "include" });

            if (response.ok) {
                const user = await response.json();
                authText.textContent = "Logout";
                authIcon.className = "fas fa-sign-out-alt";
                authButton.classList.remove("login-btn");
                // usernameDisplay.textContent = user.user.name; 

                // Set logout function on button click
                authButton.onclick = logoutUser;
            } else {
                throw new Error("User not authenticated");
            }
        } catch (error) {
            console.log("User not logged in:", error);
            authText.textContent = "Login";
            authIcon.className = "fas fa-sign-in-alt";
            authButton.classList.add("login-btn");

            authButton.onclick = () => {
                window.location.href = "/registration2.html"; 
            };

            // usernameDisplay.textContent = "Guest"; 
        }
    }

    toggleAuthState(); // On page load

    // Logout User
    async function logoutUser() {
        try {
            const response = await fetch("/auth/logout", {
                method: "POST",
                credentials: "include", // Send cookies to backend
            });
    
            if (response.ok) {
                console.log("Logged out successfully!");

                localStorage.removeItem("threadId"); // Remove threadId for guest users
                localStorage.removeItem("username"); 
                localStorage.setItem("username", "guest_user");
                localStorage.removeItem("userId"); 

                window.location.href = "/"; // Redirect to homepage or login page
            } else {
                console.error("Logout failed.");
            }
    
            console.log("Logged out successfully");
    
            // Reset UI
            document.getElementById("authText").textContent = "Login";
            document.getElementById("authIcon").className = "fas fa-sign-in-alt";
            document.getElementById("authButton").classList.add("login-btn");
            document.getElementById("usernameDisplay").textContent = "Guest";
    
            // Refresh page to fully clear session
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }

    async function getThreadId() {
        let threadId = localStorage.getItem("threadId");
    
        if (!threadId) {
            console.log("Creating new guest thread...");
            const response = await fetch("/create-thread", { method: "POST" });
            const data = await response.json();
            threadId = data.threadId;
            localStorage.setItem("threadId", threadId);
        }
    
        return threadId;
    }

    // ChatBox Behavior
    const chatBox = document.getElementById('chatBox');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('chatMessages');
    const chatArea = document.getElementById('chatArea'); 
    const chatMessages = document.getElementById('chatMessages');

    // Function to format response text (bold text inside **text**)
    function formatResponseText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')  // Convert **text** to <b>text</b> for bold
            .replace(/\n/g, '<br>');  // Convert newlines to <br> for proper formatting
    }

    // Add a message to the chat interface
    // function addMessage(content, className) {
    //     const messageDiv = document.createElement('div');
    //     messageDiv.className = className;

    //     // Format the message before displaying
    //     messageDiv.innerHTML = formatResponseText(content); 

    //     messagesContainer.appendChild(messageDiv);
    //     messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
    // }

    function addMessage(content, className) {
        const messageDiv = document.createElement("div");
        messageDiv.className = className;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
    
        // Call typewriter animation for bot messages
        if (className.includes("bot-message")) {
            typeWriter(content, messageDiv);
        } else {
            messageDiv.innerHTML = formatResponseText(content); // Direct display for user messages
        }
    }

    // Typewriter animation for bot messages
    function typeWriter(text, element) {
        const formattedText = formatResponseText(text); // Apply formatting before animation
        const words = formattedText.split(" "); // Split formatted text into words
        let i = 0;
        const speed = 100; // Adjust speed (100ms per word)
    
        function type() {
            if (i < words.length) {
                element.innerHTML += words[i] + " ";
                i++;
                messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll
                setTimeout(type, speed);
            }
        }
        type();
    }


    // Handle sending a message (Function sendMessage()), Update: apply formatting before display
    async function sendMessage() {
        const userMessage = messageInput.value.trim();
        if (!userMessage) return; // Don't send empty message

        async function sendMessage() {
            const userMessage = messageInput.value.trim();
            if (!userMessage) return; // Don't send empty message
        
            let userId = localStorage.getItem("userId"); // Get userId if logged in

            if (!userId) {
                // If no user is logged in, generate a temporary guestId
                userId = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
            }
        
            addMessage(userMessage, "message user-message");
            messageInput.value = "";
        
            const loadingDiv = document.createElement("div");
            loadingDiv.className = "message bot-message";
            loadingDiv.textContent = "typing...";
            messagesContainer.appendChild(loadingDiv);
        
            try {
                const response = await fetch("/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, prompt: userMessage, threadId: localStorage.getItem("threadId") || null }),
                });
        
                if (response.ok) {
                    const data = await response.json();
                    if (data.content) {
                        loadingDiv.remove();
                        addMessage(data.content, "message bot-message");
                    } else {
                        console.error("Assistant returned empty response:", data);
                        addMessage("Error: No response from assistant. (External API call have been cut off or incomplete)", "message bot-message");
                    }
                } else {
                    console.error("Server Error:", errorText);
                    loadingDiv.remove();
                    addMessage("Error: Unable to fetch response.", "message bot-message");
                }
            } catch (error) {
                console.error('Network Error:', error);
                loadingDiv.remove();
                addMessage("Network error, please check your connection.", "message bot-message");
            }
        }

        // Add the user's message to the chat
        addMessage(userMessage, 'message user-message');
        messageInput.value = ''; // Clear the input field

        // loading indicator to the chat
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.textContent = 'typing...';

        setTimeout(() => {
            if (loadingDiv.parentNode) {
                loadingDiv.textContent = 'Still thinking...';
            }
        }, 5000); // 5 seconds

        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom

        // Get selected model
        // const selectedModel = modelText.textContent === 'GPT' ? 'DeepSeek' : 'GPT';

        try {
            let userId = localStorage.getItem('userId');

            if (!userId || isNaN(userId)) {
                userId = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit numeric ID
                localStorage.setItem('userId', userId);
            }

            userId = parseInt(userId, 10); // Ensure it's a number before sending

            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, prompt: userMessage, threadId: localStorage.getItem('threadId') || null }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.content) {
                    let botMessage = data.content; // get formatted response

                    // Display response as HTML so Markdown formatting applies
                    const botMessageDiv = document.createElement('div');
                    botMessageDiv.className = 'message bot-message';
                    botMessageDiv.innerHTML = botMessage.replace(/\n/g, '<br>'); // Convert newlines to HTML

                    loadingDiv.remove();
                    addMessage(botMessage, 'message bot-message'); // Correctly add message
                } else {
                    console.error("Empty response from assistant:", data);
                    addMessage("Error: No response from assistant. (External API call have been cut off or incomplete)", "message bot-message");
                }
            } else {
                const errorText = await response.text();
                console.error("Server Error:", errorText); // 🔹 Log the server error in console
                loadingDiv.remove(); // Remove the loading text
                addMessage('Error: Unable to fetch response.', 'message bot-message');
            }
        } catch (error) {
            console.error('Error:', error);
            loadingDiv.remove(); // Remove the loading text
            addMessage('Error: Something went wrong.', 'message bot-message');
        }
    }
    // Reset ChatArea
    newChatBtn.addEventListener('click', () => { 
        location.reload();  
    });

    // Handle User Input, Button validation
    let isFirstSend = true;

    sendBtn.addEventListener('click', () => {
        if(messageInput.value.trim() === ''){
            return;
        } else {
            handleFirstSend(); // call function for first time send
            sendMessage();
        }
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            //Prevent empty textbox
            if(messageInput.value.trim() === ''){
                return;
            }

            if(isFirstSend) {
                handleFirstSend(); 
            }
            sendMessage(); 
        }
    });

    function handleFirstSend() {
        // call active class for chat elements
        chatBox.classList.add('active');
        chatArea.classList.add('active');
        chatMessages.classList.add('active');

        // Remove header and prompt elements
        if (header) header.remove();
        if (prompt) prompt.remove();

        isFirstSend = false; // mark first send as completed
    }

    // Handle Profile Edit Modal
    const profileEditBtn = document.getElementById("profileBtn");

// Handle AI model, Toggle validation
    // const modelToggle = document.querySelector('.model-toggle');
    // const modelText = document.getElementById('modelText');
    // const modelIcon = document.getElementById('modelIcon');

    // // Get saved model or default to GPT
    // let selectedModel = localStorage.getItem('selectedModel') || 'GPT';
    // modelText.textContent = selectedModel;
    // modelIcon.src = selectedModel === 'GPT' ? '/icons/chatgpt-icon2.svg' : '/icons/deepseek-icon.svg';

    // // Handel click
    // modelToggle.addEventListener('click', () => {
    //     selectedModel = selectedModel === 'GPT' ? 'DeepSeek' : 'GPT';
    //     modelText.textContent = selectedModel;
    //     modelIcon.src = selectedModel === 'GPT' ? '/icons/chatgpt-icon2.svg' : '/icons/deepseek-icon.svg';
    //     // save preference
    //     localStorage.setItem('selectedModel', selectedModel);
    // });
});