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
        }

        this.shadowRoot.querySelector(".chatbot-button").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.querySelector(".close-button").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.querySelector(".chatbot-input").addEventListener("keypress", (e) => this.UserInput(e));
    }

    toggleChat() {
        const chatbotContainer = this.shadowRoot.querySelector(".chatbot-container");
        chatbotContainer.style.display = chatbotContainer.style.display === "none" || chatbotContainer.style.display === "" ? "flex" : "none";
    }


    connectedCallback() {
        this.uuid = this.getAttribute('uuid');
        if (!this.uuid) return;

        this.socket = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/1.0/support/${this.uuid}/ws`);

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
        if (e.key === "Enter") {
            const inputField = this.shadowRoot.querySelector(".chatbot-input");
            if (this.isBotTyping || inputField.disabled) return;

            const userMessage = inputField.value;
            if (this.socket && this.socket.readyState === WebSocket.OPEN && userMessage.trim() !== "") {
                this.socket.send(userMessage);
                this.displayMessage(userMessage, "user");
                inputField.value = "";
            } else {
                console.log("Ошибка: WebSocket не открыт или сообщение пустое.");
            }
        }
    }
    
    // Метод для отображения сообщения с эффектом печати 
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
        }, 50);
    }

    displayMessage(message, sender) {
        const messageElem = document.createElement('div');
        messageElem.textContent = `${sender === "user" ? "Вы: " : "Бот: "} ${message}`;
        if (sender === "user") {
            messageElem.classList.add("message-user"); 
        } else {
            messageElem.classList.add("message-bot");
        }
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
