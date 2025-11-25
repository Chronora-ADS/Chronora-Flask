// AccountCreation.js
document.addEventListener("DOMContentLoaded", function () {
    // --- Manipulação do botão de anexar documento ---
    document.getElementById('btn-annex').addEventListener('click', function () {
        document.getElementById('input-file').click();
    });

    document.getElementById('input-file').addEventListener('change', function () {
        const fileName = this.files[0] ? this.files[0].name : '';
        document.getElementById('file-chosen').textContent = fileName;
    });

    // --- Manipulação do envio do formulário ---
    document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('input-name').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const phoneNumberStr = document.getElementById('input-phone-number').value.trim();
        const password = document.getElementById('input-password').value;
        const confirmPassword = document.getElementById('input-confirm-password').value;

        const fileInput = document.getElementById('input-file');

        // Validação
        if (!name || !email || !phoneNumberStr || !password || !confirmPassword) {
            alert("Todos os campos são obrigatórios.");
            return;
        }

        const phoneNumber = parseInt(phoneNumberStr.replace(/\D/g, ''));
        if (isNaN(phoneNumber) || phoneNumber.toString().length < 10) {
            alert("Número de telefone inválido.");
            return;
        }

        if (password.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }

        if (!fileInput.files[0]) {
            alert("Selecione um documento com foto");
            return;
        }

        // Converte o arquivo para Base64
        let documentBase64 = "";
        try {
            documentBase64 = await convertToBase64(fileInput.files[0]);
        } catch (err) {
            alert("Erro ao converter documento para Base64.");
            console.error(err);
            return;
        }

        // Extrai apenas a parte base64 (remove o prefixo data:image/...)
        const base64Data = documentBase64.split(',')[1] || documentBase64;

        // Monta o payload conforme esperado pelo Flask
        const payload = {
            "name": name,
            "email": email,
            "phoneNumber": phoneNumber,
            "password": password,
            "confirmPassword": confirmPassword,
            "document": base64Data  // Envia apenas a string base64
        };

        // Envia para o backend Flask
        try {
            const response = await fetch("http://localhost:5000/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();

            if (response.ok) {
                alert("Cadastro realizado com sucesso!");
                window.location.href = "/"; // Redireciona para login
            } else {
                alert("Erro ao cadastrar: " + (responseData.error || responseData.message || "Erro desconhecido"));
            }
        } catch (err) {
            alert("Falha na comunicação com o servidor: " + err.message);
            console.error(err);
        }
    });

    // Função auxiliar para converter arquivo para Base64
    function convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
});