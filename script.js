class ChatBot extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }); // изолируем стили и разметку от остальной страницы
        this.socket = null; 
        this.render(); //  рендеринг HTML-разметки
    }

    render() {
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
                }
                .chatbot-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    height: 400px;
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
                }
                .chatbot-input {
                    width: 100%;
                    padding: 5px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
            </style>
            <button class="chatbot-button">Поддержка</button>
            <div class="chatbot-container">
                <div class="chatbot-header">
                    <h3>Техподдержка</h3>
                    <button class="close-button">❌</button>
                </div>
                <div class="chatbot-messages">Задайте ваш вопрос...</div>
                <input type="text" class="chatbot-input" placeholder="Напишите сообщение...">
            </div>
        `;

        this.shadowRoot.querySelector(".chatbot-button").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.querySelector(".close-button").addEventListener("click", () => this.toggleChat());
        this.shadowRoot.querySelector(".chatbot-input").addEventListener("keypress", (e) => this.UserInput(e));

        //WebSocket-соединение
        this.connectWebSocket();
    }

    toggleChat() {
        const chatbotContainer = this.shadowRoot.querySelector(".chatbot-container");
        chatbotContainer.style.display = chatbotContainer.style.display === "none" || chatbotContainer.style.display === "" ? "flex" : "none";
    }

    connectWebSocket() {
        this.socket = new WebSocket("ws://localhost:8001"); // Подключаемся к серверу WebSocket на порту 8001

        this.socket.onopen = () => {
            console.log("Соединение установлено");
        };

        this.socket.onmessage = (event) => {
            this.displayMessage(event.data, "server");
        };

        this.socket.onerror = (error) => {
            console.log("Ошибка WebSocket: ", error);
        };

        this.socket.onclose = () => {
            console.log("Соединение закрыто");
        };
    }

    UserInput(e) {
        if (e.key === "Enter") {
            const userMessage = this.shadowRoot.querySelector(".chatbot-input").value;

            // Проверка, что WebSocket соединение установлено и сообщение не пустое
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                if (userMessage.trim() !== "") {
                    this.socket.send(userMessage); 
                    this.displayMessage(userMessage, "user"); 
                    this.shadowRoot.querySelector(".chatbot-input").value = ""; // Очищаем поле ввода
                } else {
                    console.log("Ошибка: сообщение пустое.");
                }
            } else {
                console.log("Ошибка: WebSocket не открыт.");
            }
        }
    }

    displayMessage(message, sender) {
        const messageElem = document.createElement('div');
        messageElem.textContent = `${sender === "user" ? "Вы: " : "Бот: "} ${message}`;
        this.shadowRoot.querySelector(".chatbot-messages").appendChild(messageElem);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesDiv = this.shadowRoot.querySelector(".chatbot-messages");
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

customElements.define("chat-bot", ChatBot);
