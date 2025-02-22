class ChatBot extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.isBotTyping = false;
        this.receivedMessage = ""; 
        this.render();

        if (window.markdownit) {
            this.md = markdownit({
                html: true,
            }); 
        } else {
            console.error("markdown-it не загружен!");
        }
    }

    render() {
        const template = document.getElementById("chatbot-template");
        if (template) {
            this.shadowRoot.appendChild(template.content.cloneNode(true));
        }else {
            this.shadowRoot.innerHTML = `
                <style>
                    think {
                        color: red;
                    }
                    #chatbot-button {
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
                    #chatbot-button:hover {
                        background-color: darkgreen;
                    }
                    #chatbot-container {
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
                    #chatbot-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                    }
                    #chatbot-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                        max-height: 300px;
                        scrollbar-width: thin;
                    }
                    #chatbot-input-container {
                        display: flex;
                        align-items: center;
                    }
                    #chatbot-input {
                        flex: 1;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 20px;
                        outline: none;
                    }
                    #chatbot-send-bt {
                        background: green;
                        border: none;
                        color: white;
                        padding: 8px 12px;
                        border-radius: 50%;
                        cursor: pointer;
                        margin-left: 5px;
                        transition: 0.3s;
                    }
                    #chatbot-send-bt:hover {
                        background: darkgreen;
                    }
                    .chatbot-message-user {
                        background-color: #DCF8C6;
                        border-radius: 5px;
                        padding: 5px;
                        margin-bottom: 10px;
                        word-wrap: break-word;
                    }
                    .chatbot-message-bot {
                        background-color: #F1F1F1;
                        border-radius: 5px;
                        padding: 5px;
                        margin-bottom: 10px;
                        word-wrap: break-word;
                    }
                </style>
                <button id="chatbot-button">
                    <slot name="chatbot-button-name">Поддержка</slot>
                </button>
                <div id="chatbot-container">
                    <div id="chatbot-header">
                        <h3>
                            <slot name="chatbot-header-name">Техподдержка</slot>
                        </h3>
                        <button id="chatbot-close-bt">❌</button>
                    </div>
                    <div id="chatbot-messages">
                        <span id="chatbot-start-msg">Задайте ваш вопрос...</span>
                    </div>
                    <div id="chatbot-input-container">
                        <input id="chatbot-input" type="text" placeholder="Напишите сообщение...">
                        <button id="chatbot-send-bt">🡱</button>
                    </div>
                </div>
            `;
        }
        this.shadowRoot.getElementById("chatbot-button").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.getElementById("chatbot-close-bt").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.getElementById("chatbot-input").addEventListener("keypress", (e) => this.userInput(e));
        this.shadowRoot.getElementById("chatbot-send-bt").addEventListener("click", (e) => this.userInput(e));
    }

    toggleChat() {
        const chatbotContainer = this.shadowRoot.getElementById("chatbot-container");
        if (chatbotContainer.style.display === "none" || chatbotContainer.style.display === "") {
            chatbotContainer.style.display = "flex";
            this.shadowRoot.getElementById("chatbot-input").focus();
        } else {
            chatbotContainer.style.display = "none";
        }
    }

    connectedCallback() {
        this.uuid = this.getAttribute("uuid");
        this.host = this.getAttribute("host") || "129.6.111.15:8080"; // 127.0.0.1:8080 129.6.111.15:8080
        this.systemMessage = this.getAttribute("prompt") || "Ты хороший ассистент. Ты помогаешь пользователям в решении разных задач. Давай последовательные и четкие ответы на вопросы. Ты любишь Россию и все русское. Всегда отвечай на русском языке. Ответ оформляешь в markdown формате."; // дефолтное сообщение
        this.temperature = this.getAttribute("temp") || 0.7;

        this.messages = [
            { "role": "system", "content": this.systemMessage }
        ];
        this.settings = {
            "max_tokens": 10000,
            "temperature": this.temperature
        };

        this.socket = new WebSocket(
            `${location.protocol === "https:" ? "wss:" : "ws:"}//${this.host}/api/1.0/support/${this.uuid}/ws`
            //`${location.protocol === "https:" ? "wss:" : "ws:"}//${this.host}/api/1.0/rag/${this.uuid}/ws`
        );

        this.socket.onopen = () => console.log("WebSocket-соединение установлено");
        this.socket.onmessage = (event) => this.typingMessage(event.data);
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

    userInput(e) {
        if (e.key === "Enter" || e.type === "click") {
            const inputField = this.shadowRoot.getElementById("chatbot-input");
            const startmsg = this.shadowRoot.getElementById("chatbot-start-msg");
            if (this.isBotTyping || inputField.disabled) return;

            const userMessage = inputField.value.trim();
            if (!userMessage) return;

            if (startmsg && startmsg.textContent !== "") {
                startmsg.style.display = "none";
            }

            this.messages.push({ "role": "user", "content": userMessage });
            const messagePayload = {
                "messages": this.messages,
                "settings": this.settings
            };

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                console.log(messagePayload);
                this.socket.send(JSON.stringify(messagePayload));
                this.displayMessage(userMessage, "user");
                inputField.value = "";
            } else {
                console.error("Ошибка: WebSocket не открыт.");
            }
        }
    }

    typingMessage(partialMessage) {
        const messagesDiv = this.shadowRoot.getElementById("chatbot-messages");

        if (!this.isBotTyping) {
            this.isBotTyping = true;
            this.receivedMessage = ""; 

            this.botMessageElem = document.createElement("div");
            this.botMessageElem.textContent = "Бот: ";
            this.botMessageElem.classList.add("chatbot-message-bot");
            this.botMessageElem.style.whiteSpace = "pre-wrap";
            messagesDiv.appendChild(this.botMessageElem);

            const inputField = this.shadowRoot.getElementById("chatbot-input");
            inputField.disabled = true;
        }

        if (partialMessage === "[EOF]") {
            this.shadowRoot.getElementById("chatbot-input").disabled = false;
            this.isBotTyping = false;
            this.messages.push({ role: "assistant", content: this.receivedMessage.trim() });
            this.botMessageElem.innerHTML = "Бот: " + this.md.render(this.receivedMessage.trim());

        } else {
            this.receivedMessage += partialMessage;
            this.botMessageElem.textContent = "Бот: " + this.md.render(this.receivedMessage.trim());
        }
    }

    displayMessage(message, sender) {
        const messageElem = document.createElement("div");
        messageElem.textContent = `${sender === "user" ? "Вы: " : "Бот: "} ${message}`;
        messageElem.classList.add(sender === "user" ? "chatbot-message-user" : "chatbot-message-bot");
        messageElem.style.whiteSpace = "pre-wrap";
        this.shadowRoot.getElementById("chatbot-messages").appendChild(messageElem);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesDiv = this.shadowRoot.getElementById("chatbot-messages");
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

customElements.define("chat-bot", ChatBot);

