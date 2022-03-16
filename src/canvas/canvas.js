window.addEventListener("message", (event) => {
    const message = event.data;
    document.body.style.backgroundColor = message.color;
});