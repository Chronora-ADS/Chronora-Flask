// Main.js
document.addEventListener("DOMContentLoaded", function () {
    // ----- TAG DE CATEGORIAS -----
    const inputCategory = document.getElementById('input-category');
    const tagList = document.getElementById('category-tag-list');

    if (inputCategory && tagList) {
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

    // Dados simulados de categorias
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

        const sliderWidth = slider.offsetWidth;
        const thumbWidth = 20;
        const pos = percent * (sliderWidth - thumbWidth) + (thumbWidth / 2);

        tooltip.style.left = calc(`${pos}px - ${tooltip.offsetWidth / 2}px + 25px`);
    }

    if (slider && tooltip) {
        slider.addEventListener("input", updateTooltip);
        window.addEventListener("resize", updateTooltip);
        updateTooltip();
    }

    // ----- FETCH DE SERVIÇOS -----
    const requestsContainer = document.getElementById("requests");
    const token = localStorage.getItem("auth_token");

    if (!requestsContainer) {
        console.error("Elemento #requests não encontrado.");
        return;
    }

    if (!token) {
        console.error("Token não encontrado no localStorage.");
        requestsContainer.innerHTML = "<p style='color: white;'>Você precisa estar logado para visualizar os serviços.</p>";
        return;
    }

    // Faz a requisição para o backend Flask
    fetch("http://localhost:5000/service/get/all", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    })
    .then(async response => {
        if (!response.ok) {
            if (response.status === 401) {
                alert("Sessão expirada. Faça login novamente.");
                localStorage.removeItem("auth_token");
                localStorage.removeItem("user_id");
                window.location.href = "/";
                return;
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(servicos => {
        console.log("Serviços recebidos:", servicos);
        
        if (!servicos || servicos.length === 0) {
            requestsContainer.innerHTML = "<p style='color: white;'>Nenhum serviço encontrado.</p>";
            return;
        }

        requestsContainer.innerHTML = ""; // Limpa container

        servicos.forEach(servico => {
            const card = document.createElement("div");
            card.className = "service-card";

            // Verifica se serviceImage existe e é uma string base64 válida
            let imageSrc = "/static/img/default-service.png"; // Imagem padrão
            if (servico.serviceImage && typeof servico.serviceImage === 'string') {
                imageSrc = `data:image/png;base64,${servico.serviceImage}`;
            }

            // Monta o HTML do card do serviço
            card.innerHTML = `
                <img src="${imageSrc}" alt="Imagem do Serviço" class="service-image">
                <div class="service-info">
                    <p class="service-title">${servico.title || 'Sem título'}</p>
                    <p class="user-service">Postado por ${servico.userEntity?.name || 'Usuário desconhecido'}</p>
                    <div class="qty-chronos-service">
                        <img class="qty-chronos-service-img" src="/static/img/Coin.png" alt="Chronos Icon">
                        <p class="qty-chronos-service-text">${servico.timeChronos || 0} chronos</p>
                    </div>
                    <div class="categories-service">
                        ${servico.categoryEntities && servico.categoryEntities.length > 0 
                            ? servico.categoryEntities.map(cat => `
                                <div class="category-service">
                                    <img class="category-service-img" src="/static/img/Paintbrush.png" alt="Category Icon">
                                    <p class="category-service-text">${cat.name || 'Categoria'}</p>
                                </div>
                            `).join('')
                            : '<p class="category-service-text">Sem categorias</p>'
                        }
                    </div>
                </div>
            `;

            requestsContainer.appendChild(card);
        });
    })
    .catch(error => {
        console.error("Erro completo ao carregar serviços:", error);
        requestsContainer.innerHTML = <p style='color: white;'>Falha ao carregar os serviços: ${error.message}</p>;
    });
});