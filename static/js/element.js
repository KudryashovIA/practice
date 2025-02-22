customElements.define("my-element", class extends HTMLElement {
    connectedCallback() {
        console.log(this.getAttribute("uuid"));

        let socket = new WebSocket(
            `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/1.0/support/${this.getAttribute("uuid")}/ws`
        );

        socket.onopen = function(e) {
            console.log("[open] Соединение установлено");
            console.log("Отправляем данные на сервер");
            socket.send("Меня зовут Джон");
        };

        socket.onmessage = function(event) {
            console.log(`[message] Данные получены с сервера: ${event.data}`);
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
            } else {
            console.log('[close] Соединение прервано');
            }
        };

        socket.onerror = function(error) {
        console.log(`[error]`);
        };
    }
});

