class ChatBot extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.isBotTyping = false;
        this.render();
    }

    render() {
        const template = document.getElementById("chatbot-template");
        if (template) {
            this.shadowRoot.appendChild(template.content.cloneNode(true));
        } else {
            this.shadowRoot.innerHTML = `
                <style>
                    .chatbot-button {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background-color: green;
                        color: white;
                        padding: 10px 15px;
                        border: none;
                        border-radius: 50px;
                        cursor: pointer;
                        transition: 0.3s;
                    }
                    .chatbot-button:hover {
                        background-color: darkgreen;
                    }
                    .chatbot-container {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        width: 320px;
                        height: 420px;
                        background: white;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        border-radius: 10px;
                        display: none;
                        flex-direction: column;
                        padding: 10px;
                    }
                    .chatbot-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                    }
                    .chatbot-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                        max-height: 300px;
                        scrollbar-width: thin;
                    }
                    .chatbot-input-container {
                        display: flex;
                        align-items: center;
                    }
                    .chatbot-input {
                        flex: 1;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 20px;
                        outline: none;
                    }
                    .send-button {
                        background: green;
                        border: none;
                        color: white;
                        padding: 8px 12px;
                        border-radius: 50%;
                        cursor: pointer;
                        margin-left: 5px;
                        transition: 0.3s;
                    }
                    .send-button:hover {
                        background: darkgreen;
                    }
                    .message-user {
                        background-color: #DCF8C6;
                        border-radius: 5px;
                        padding: 5px;
                        margin-bottom: 10px;
                        word-wrap: break-word;
                    }
                    .message-bot {
                        background-color: #F1F1F1;
                        border-radius: 5px;
                        padding: 5px;
                        margin-bottom: 10px;
                        word-wrap: break-word;
                    }
                </style>
                <button id="button" class="chatbot-button">
                    <slot name="button_name">Поддержка</slot>
                </button>
                <div class="chatbot-container">
                    <div class="chatbot-header">
                        <h3>
                            <slot name="header_name">Техподдержка</slot>
                        </h3>
                        <button id="cl_button" class="close-button">❌</button>
                    </div>
                    <div class="chatbot-messages">Задайте ваш вопрос...</div>
                    <div class="chatbot-input-container">
                        <input id="input" type="text" class="chatbot-input" placeholder="Напишите сообщение...">
                        <button id="send_button" class="send-button">↑</button>
                    </div>
                </div>
            `;
        }

        this.shadowRoot.getElementById("button").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.getElementById("cl_button").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.getElementById("input").addEventListener("keypress", (e) => this.UserInput(e));
        this.shadowRoot.getElementById("send_button").addEventListener("click", (e) => this.UserInput(e));
    }

    toggleChat() {
        const chatbotContainer = this.shadowRoot.querySelector(".chatbot-container");
        chatbotContainer.style.display = chatbotContainer.style.display === "none" || chatbotContainer.style.display === "" ? "flex" : "none";
    }

    connectedCallback() {
        this.uuid = this.getAttribute("uuid");
        if (!this.uuid) return;

        this.socket = new WebSocket(
            `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/1.0/support/${this.uuid}/ws`
        );

        this.socket.onopen = () => console.log("WebSocket-соединение установлено");
        this.socket.onmessage = (event) => this.TypingMessage(event.data);
        this.socket.onerror = (error) => console.error("Ошибка WebSocket:", error);
    }

    disconnectedCallback() {
        this.socket.onclose = (event) => {
            if (event.wasClean) {
                console.log(`Соединение закрыто чисто, код=${event.code}, причина=${event.reason}`);
            } else {
                console.log("Соединение прервано");
            }
        };
    }

    UserInput(e) {
        if (e.key === "Enter" || e.type === "click") {
            const inputField = this.shadowRoot.querySelector(".chatbot-input");
            const messagesDiv = this.shadowRoot.querySelector(".chatbot-messages");
            if (this.isBotTyping || inputField.disabled) return;
    
            const userMessage = inputField.value.trim();
            if (!userMessage) return;

            if (messagesDiv.textContent === "Задайте ваш вопрос...") {
                messagesDiv.innerHTML = "";
            }
    
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                const messagePayload = {
                    "message": [
                        { "role": "system", "content": "Ты хороший ассистент. Ты помогаешь пользователям в решении разных задач. Давай последовательные и четкие ответы на вопросы. Ты любишь Россию и все русское. Всегда отвечай на русском языке. Ответ оформляешь в markdown формате." },
                        { "role": "user", "content": userMessage }
                    ],
                    "settings": { "max_tokens": 10000, "temperature": 0.7 }
                };
                console.log(messagePayload);
                this.socket.send(JSON.stringify(messagePayload));
                this.displayMessage(userMessage, "user");
                inputField.value = "";
            } else {
                console.error("Ошибка: WebSocket не открыт.");
            }
        }
    }
    
    TypingMessage(message) {
        const messagesDiv = this.shadowRoot.querySelector(".chatbot-messages");
        const botMessageElem = document.createElement("div");
        botMessageElem.textContent = "Бот: ";
        botMessageElem.classList.add("message-bot");
        botMessageElem.style.whiteSpace = "pre-wrap";
        messagesDiv.appendChild(botMessageElem);

        const typingIndicator = document.createElement("div");
        typingIndicator.textContent = "печатает...";
        messagesDiv.appendChild(typingIndicator);
        this.scrollToBottom();

        const inputField = this.shadowRoot.querySelector(".chatbot-input");
        inputField.disabled = true;
        this.isBotTyping = true;

        let index = 0;
        const interval = setInterval(() => {
            if (index < message.length) {
                botMessageElem.textContent += message[index];
                index++;
                this.scrollToBottom();
            } else {
                clearInterval(interval);
                messagesDiv.removeChild(typingIndicator);
                inputField.disabled = false;
                this.isBotTyping = false;
            }
        }, 5);
    }

    displayMessage(message, sender) {
        const messageElem = document.createElement("div");
        messageElem.textContent = `${sender === "user" ? "Вы: " : "Бот: "} ${message}`;
        messageElem.classList.add(sender === "user" ? "message-user" : "message-bot");
        messageElem.style.whiteSpace = "pre-wrap";
        this.shadowRoot.querySelector(".chatbot-messages").appendChild(messageElem);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesDiv = this.shadowRoot.querySelector(".chatbot-messages");
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

customElements.define("chat-bot", ChatBot);
