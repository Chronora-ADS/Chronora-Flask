// ServiceCreation.js
document.addEventListener("DOMContentLoaded", function () {
    // --- Manipulação do botão de imagem do serviço ---
    document.getElementById('btn-service-image').addEventListener('click', function () {
        document.getElementById('input-service-image').click();
    });

    document.getElementById('input-service-image').addEventListener('change', function () {
        const fileName = this.files[0] ? this.files[0].name : '';
        document.getElementById('service-image-chosen').textContent = fileName;
    });

    // ----- TAG DE CATEGORIAS -----
    const inputCategory = document.getElementById('input-category');
    const tagList = document.getElementById('category-tag-list');

    if (inputCategory && tagList) { // Verifica se os elementos existem
        inputCategory.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && inputCategory.value.trim() !== "") {
                e.preventDefault();
                const category = inputCategory.value.trim();

                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.innerHTML = `
                    ${category}
                    <span class="remove-tag" onclick="removeTag(this)">×</span>
                `;
                tagList.appendChild(tag);

                inputCategory.value = ""; // Limpa o input
            }
        });
    }

    // Função global para remover tag
    window.removeTag = function (element) {
        element.parentElement.remove();
    }

    // --- Manipulação do envio do formulário ---
     document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const title = document.getElementById('input-title').value.trim();
        const description = document.getElementById('input-description').value.trim();
        const timeChronosStr = document.getElementById('input-time-chronos').value.trim();
        const imageInput = document.getElementById('input-service-image');
        const file = imageInput.files[0];

        // Validação
        if (!title || !description || !timeChronosStr) {
            alert("Título, descrição e tempo em Chronos são obrigatórios.");
            return;
        }

        const timeChronos = parseInt(timeChronosStr);
        if (isNaN(timeChronos) || timeChronos <= 0) {
            alert("Tempo em Chronos deve ser um número positivo.");
            return;
        }

        if (!file) {
            alert("Selecione uma imagem para o serviço.");
            return;
        }

        // Obtém o user_id do localStorage
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Você precisa estar logado para criar um serviço.");
            window.location.href = "http://127.0.0.1:5000/login";
            return;
        }

        // Converte a imagem para Base64 (MANTENHA o prefixo)
        let serviceImageBase64 = "";
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise(resolve => reader.onload = resolve);
            serviceImageBase64 = reader.result; // ← Mantenha o Base64 completo
        } catch (err) {
            alert("Erro ao converter imagem para Base64.");
            console.error(err);
            return;
        }

        // Monta o payload (sem categorias por enquanto)
        const payload = {
            title,
            description,
            timeChronos,
            categoryEntities: [], // ← Array vazio temporariamente
            serviceImage: serviceImageBase64
        };

        console.log("Payload enviado:", payload);

        const token = localStorage.getItem("auth_token");
        if (!token) {
            alert("Token de autenticação não encontrado.");
            window.location.href = "http://127.0.0.1:5000/login";
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/service/post/${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Serviço criado com sucesso!");
                window.location.href = "http://127.0.0.1:5000/";
            } else {
                let errorMessage = "Erro desconhecido ao criar serviço.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    try {
                        errorMessage = await response.text();
                    } catch (textError) {
                        console.error("Erro ao ler resposta:", textError);
                    }
                }
                
                if (response.status === 401 || response.status === 422) {
                    alert("Sessão expirada. Faça login novamente.");
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_id");
                    window.location.href = "http://127.0.0.1:5000/login";
                } else {
                    alert(`Erro ${response.status}: ${errorMessage}`);
                }
            }
        } catch (err) {
            alert("Falha na comunicação com o servidor.");
            console.error(err);
        }
    });
});