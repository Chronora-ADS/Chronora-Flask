// Login.js
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('input-email').value.trim();
        const password = document.getElementById('input-password').value;

        if (!email || !password) {
            alert("Preencha todos os campos.");
            return;
        }

        try {
            // Envia para o backend Flask
            const response = await fetch("http://127.0.0.1:5000/auth/login", { // URL atualizada para Flask
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const token = await response.text(); // Flask retorna o token como texto puro
                localStorage.setItem("auth_token", token); // Armazena o token
                window.location.href = "http://127.0.0.1:5000/"; // Redireciona para a página principal no Flask
            } else {
                const errorData = await response.json().catch(() => ({})); // Tenta parse JSON de erro
                const errorMessage = errorData.error || await response.text(); // Usa mensagem JSON ou texto
                alert("Erro ao fazer login: " + errorMessage);
            }
        } catch (err) {
            alert("Falha na comunicação com o servidor.");
            console.error(err);
        }
    });
});