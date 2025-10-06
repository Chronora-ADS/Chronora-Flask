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
        e.preventDefault(); // Impede o envio padrão do formulário

        const name = document.getElementById('input-name').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const phoneNumberStr = document.getElementById('input-phone-number').value.trim();
        const password = document.getElementById('input-password').value;
        const confirmPassword = document.getElementById('input-confirm-password').value;

        const fileInput = document.getElementById('input-file');

        // Validação simples
        if (!name || !email || !phoneNumberStr || !password || !confirmPassword) {
            alert("Todos os campos são obrigatórios.");
            return;
        }

        // Validação do número de telefone (remove não-dígitos e verifica comprimento)
        const phoneNumber = parseInt(phoneNumberStr.replace(/\D/g, ''));
        if (isNaN(phoneNumber) || phoneNumber.toString().length < 10) { // Ajuste o comprimento conforme necessário
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

        // Monta o payload
        const payload = {
            name,
            email,
            phoneNumber, // Envia o número como inteiro
            password,
            confirmPassword, // O backend Flask irá validar no lado do servidor
            document: documentBase64
        };

        // Envia para o backend Flask
        try {
            const response = await fetch("http://127.0.0.1:5000/auth/register", { // URL atualizada para Flask
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Cadastro realizado com sucesso!");
                window.location.href = "http://127.0.0.1:5000/login"; // Redireciona para login no Flask
            } else {
                const errorData = await response.json().catch(() => ({})); // Tenta parse JSON de erro
                const errorMessage = errorData.error || await response.text(); // Usa mensagem JSON ou texto
                alert("Erro ao cadastrar: " + errorMessage);
            }
        } catch (err) {
            alert("Falha na comunicação com o servidor.");
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