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
            const response = await fetch("http://localhost:5000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Salva o token JWT
                localStorage.setItem("auth_token", data.access_token);
                localStorage.setItem("user_id", data.user_id);
                
                alert("Login realizado com sucesso!");
                window.location.href = "/home";
            } else {
                alert("Erro ao fazer login: " + (data.error || data.message || "Credenciais inválidas"));
            }
        } catch (err) {
            alert("Falha na comunicação com o servidor: " + err.message);
            console.error(err);
        }
    });
});