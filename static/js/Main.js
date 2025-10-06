// Main.js
document.addEventListener("DOMContentLoaded", function () {
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

                inputCategory.value = "";
            }
        });
    }

    // Função global para remover tag
    window.removeTag = function (element) {
        element.parentElement.remove();
    }

    // Dados simulados de categorias (Flask não tem endpoint para isso ainda)
    const categorias = ["Pintura", "Mecânica", "Engenharia", "Elétrica"];

    function popularCategoriasDatalist() {
        const datalist = document.getElementById("categorias-lista");
        if (!datalist) return;
        datalist.innerHTML = "";
        categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            datalist.appendChild(option);
        });
    }

    popularCategoriasDatalist();

    // ----- SLIDER E TOOLTIP -----
    const slider = document.getElementById("tempo-slider");
    const tooltip = document.getElementById("tooltip");

    function updateTooltip() {
        if (!slider || !tooltip) return;

        const val = parseInt(slider.value);
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const percent = (val - min) / (max - min);

        const texto = val === 0 ? "0-5" : `${val - 5}-${val}`;
        tooltip.textContent = texto;

        // Ajuste de posição do tooltip (pode precisar de ajustes finos)
        const sliderWidth = slider.offsetWidth;
        const thumbWidth = 20; // Largura aproximada do thumb
        const pos = percent * (sliderWidth - thumbWidth) + (thumbWidth / 2);

        tooltip.style.left = `calc(${pos}px - ${tooltip.offsetWidth / 2}px + 25px)`;
    }

    if (slider && tooltip) {
        slider.addEventListener("input", updateTooltip);
        window.addEventListener("resize", updateTooltip);
        updateTooltip(); // Inicializa tooltip
    }

    // ----- FETCH DE SERVIÇOS -----
    const requestsContainer = document.getElementById("requests");
    // URL atualizada para Flask
    const apiUrl = "http://127.0.0.1:5000/service/get/all";
    const token = localStorage.getItem("auth_token");

    if (!requestsContainer) {
        console.error("Elemento #requests não encontrado.");
        return;
    }

    if (!token) {
        console.error("Token não encontrado no localStorage.");
        requestsContainer.innerHTML = "<p>Você precisa estar logado para visualizar os serviços.</p>";
        return;
    }

    // Faz a requisição para o backend Flask
    fetch(apiUrl, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token // Envia o token JWT
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                alert("Sessão expirada. Faça login novamente.");
                localStorage.removeItem("auth_token");
                window.location.href = "http://127.0.0.1:5000/login"; // Redireciona para login
            }
            throw new Error("Erro ao carregar os serviços: " + response.status);
        }
        return response.json();
    })
    .then(servicos => {
        if (servicos.length === 0) {
            requestsContainer.innerHTML = "<p>Nenhum serviço encontrado.</p>";
            return;
        }

        servicos.forEach(servico => {
            const card = document.createElement("div");
            card.className = "service-card";

            // A imagem vem em Base64 do backend Flask
            const base64Image = `data:image/png;base64,${servico.serviceImage}`;

            // console.log(servico); // Útil para debug

            // Monta o HTML do card do serviço
            card.innerHTML = `
                <img src="${base64Image}" alt="Imagem do Serviço" class="service-image">
                <div class="service-info">
                    <p class="service-title">${servico.title}</p>
                    <p class="user-service">Postado por ${servico.userEntity.name}</p>
                    <div class="qty-chronos-service">
                        <img class="qty-chronos-service-img" src="{{ url_for('static', filename='img/Coin.png') }}" alt="Chronos Icon">
                        <p class="qty-chronos-service-text">${servico.timeChronos} chronos</p>
                    </div>
                    <div class="categories-service">
                        <!-- Categorias não implementadas no backend Flask ainda, exemplo estático -->
                        <div class="category-service">
                            <img class="category-service-img" src="{{ url_for('static', filename='img/Paintbrush.png') }}" alt="Category Icon">
                            <p class="category-service-text">Exemplo</p>
                        </div>
                    </div>
                </div>
            `;

            requestsContainer.appendChild(card);
        });
    })
    .catch(error => {
        console.error("Erro ao carregar serviços:", error);
        requestsContainer.innerHTML = "<p>Falha ao carregar os serviços.</p>";
    });
});