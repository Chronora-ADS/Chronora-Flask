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

        // Validação simples
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

        // Pega as categorias adicionadas como tags
        const categories = Array.from(document.querySelectorAll('#category-tag-list .tag')).map(tag => ({
            name: tag.innerText.trim().replace("×", "") // Remove o 'x' da tag
        }));

        // Converte a imagem para Base64
        let documentBase64 = "";
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise(resolve => reader.onload = resolve); // Espera carregar
            documentBase64 = reader.result.split(',')[1]; // Extrai apenas Base64 puro (sem prefixo)
        } catch (err) {
            alert("Erro ao converter imagem para Base64.");
            console.error(err);
            return;
        }

        // Monta o payload
        const payload = {
            title,
            description,
            timeChronos,
            categoryEntities: categories, // Envia categorias como array de objetos
            serviceImage: documentBase64
        };

        // Obtem o token do localStorage
        const token = localStorage.getItem("auth_token");
        if (!token) {
            alert("Você precisa estar logado para criar um serviço.");
            window.location.href = "http://127.0.0.1:5000/login"; // Redireciona para login
            return;
        }

        try {
            // Envia para o backend Flask
            const response = await fetch("http://127.0.0.1:5000/service/post/1", { // URL atualizada para Flask (user_id fixo para exemplo)
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token // Envia o token JWT
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Serviço criado com sucesso!");
                window.location.href = "http://127.0.0.1:5000/"; // Redireciona para a página principal no Flask
            } else {
                if (response.status === 401) {
                    alert("Sessão expirada. Faça login novamente.");
                    localStorage.removeItem("auth_token");
                    window.location.href = "http://127.0.0.1:5000/login";
                    return;
                }
                const errorData = await response.json().catch(() => ({})); // Tenta parse JSON de erro
                const errorMessage = errorData.error || await response.text(); // Usa mensagem JSON ou texto
                alert("Erro ao criar serviço: " + errorMessage);
            }
        } catch (err) {
            alert("Falha na comunicação com o servidor.");
            console.error(err);
        }
    });
});