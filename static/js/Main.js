// Main.js
document.addEventListener("DOMContentLoaded", function () {
    // Variáveis globais para armazenar serviços
    let todosServicos = [];
    let servicosFiltrados = [];

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
        
        // Calcula o texto mostrando de 5 em 5
        let texto = "";
        if (val === 5) {
            texto = "0-5";
        } else {
            texto = `${val-5}-${val}`;
        }
        
        tooltip.textContent = texto;

        // Posicionamento da tooltip
        const sliderWidth = slider.offsetWidth;
        const thumbWidth = 20;
        const percent = (val - min) / (max - min);
        const pos = percent * (sliderWidth - thumbWidth) + (thumbWidth / 2);
        
        // Ajuste fino para alinhar com a bolinha
        const tooltipWidth = tooltip.offsetWidth;
        tooltip.style.left = `calc(${pos}px - ${tooltipWidth / 2}px)`;
    }

    // Função para garantir que o valor seja múltiplo de 5
    function ajustarValorSlider() {
        if (!slider) return;
        
        let valor = parseInt(slider.value);
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const step = 5;
        
        // Arredonda para o múltiplo de 5 mais próximo
        valor = Math.round(valor / step) * step;
        
        // Garante que está dentro dos limites
        if (valor < min) valor = min;
        if (valor > max) valor = max;
        
        slider.value = valor;
        updateTooltip();
    }

    if (slider && tooltip) {
        // Atualiza tooltip ao mover o slider
        slider.addEventListener("input", function() {
            ajustarValorSlider();
            updateTooltip();
        });
        
        // Atualiza tooltip ao soltar o slider
        slider.addEventListener("change", function() {
            ajustarValorSlider();
            updateTooltip();
        });
        
        // Atualiza tooltip ao redimensionar a janela
        window.addEventListener("resize", updateTooltip);
        
        // Inicializa com valor correto
        ajustarValorSlider();
        updateTooltip();
    }

    // ----- PESQUISA DE SERVIÇOS -----
    const inputSearchBar = document.getElementById("input-search-bar");
    
    // Função para filtrar serviços por termo de busca
    function filtrarServicosPorTermo(termo) {
        if (!termo || termo.trim() === "") {
            // Se o campo de busca estiver vazio, mostra todos os serviços
            servicosFiltrados = [...todosServicos];
        } else {
            const termoLowerCase = termo.toLowerCase().trim();
            // Filtra serviços cujo título contenha o termo de busca (case-insensitive)
            servicosFiltrados = todosServicos.filter(servico => {
                const titulo = servico.title || '';
                return titulo.toLowerCase().includes(termoLowerCase);
            });
        }
        exibirServicos(servicosFiltrados);
    }

    // Adiciona evento de input para a barra de pesquisa
    if (inputSearchBar) {
        // Pesquisa enquanto digita (com debounce para performance)
        let timeoutId;
        inputSearchBar.addEventListener("input", function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                filtrarServicosPorTermo(this.value);
            }, 300); // Aguarda 300ms após parar de digitar
        });

        // Pesquisa ao pressionar Enter
        inputSearchBar.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                filtrarServicosPorTermo(this.value);
            }
        });

        // Pesquisa ao clicar no ícone de lupa
        const searchIcon = document.querySelector(".icon-search");
        if (searchIcon) {
            searchIcon.addEventListener("click", function() {
                filtrarServicosPorTermo(inputSearchBar.value);
            });
        }
    }

    // ----- EXIBIÇÃO DE SERVIÇOS -----
    const requestsContainer = document.getElementById("requests");
    const token = localStorage.getItem("auth_token");

    // Função para exibir serviços no container
    function exibirServicos(servicos) {
        if (!requestsContainer) return;

        requestsContainer.innerHTML = ""; // Limpa container

        if (!servicos || servicos.length === 0) {
            // Mensagem de "nenhum resultado" que ocupa todas as 4 colunas
            const mensagem = document.createElement("div");
            mensagem.className = "no-results-message";
            mensagem.textContent = "Nenhum serviço encontrado.";
            requestsContainer.appendChild(mensagem);
            return;
        }

        // GARANTE QUE O GRID SEMPRE TENHA 4 COLUNAS
        requestsContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
        requestsContainer.style.gap = "20px";

        servicos.forEach(servico => {
            const card = document.createElement("div");
            card.className = "service-card";
            card.style.width = "100%"; // Força 100% da coluna

            // Verifica se serviceImage existe e é uma string base64 válida
            let imageSrc = "/static/img/default-service.png"; // Imagem padrão
            if (servico.serviceImage && typeof servico.serviceImage === 'string') {
                imageSrc = `data:image/png;base64,${servico.serviceImage}`;
            }

            // Limita o título a 25 caracteres
            const titulo = servico.title || 'Sem título';
            const tituloLimitado = titulo.length > 25 ? titulo.substring(0, 25) + '...' : titulo;

            // Limita a descrição (se tiver)
            const descricao = servico.description || '';
            const descricaoLimitada = descricao.length > 60 ? descricao.substring(0, 60) + '...' : descricao;

            // Limita categorias (máximo 3)
            let categoriasHTML = '';
            if (servico.categoryEntities && servico.categoryEntities.length > 0) {
                const categoriasLimitadas = servico.categoryEntities.slice(0, 3); // Máximo 3 categorias
                categoriasHTML = categoriasLimitadas.map(cat => `
                    <div class="category-service">
                        <img class="category-service-img" src="/static/img/Paintbrush.png" alt="Category Icon">
                        <p class="category-service-text">${(cat.name || 'Categoria').substring(0, 12)}${(cat.name || '').length > 12 ? '...' : ''}</p>
                    </div>
                `).join('');
            } else {
                categoriasHTML = '<div class="category-service"><p class="category-service-text">Sem categorias</p></div>';
            }

            // Monta o HTML do card do serviço
            card.innerHTML = `
                <img src="${imageSrc}" alt="Imagem do Serviço" class="service-image">
                <div class="service-info">
                    <p class="service-title" title="${servico.title || ''}">${tituloLimitado}</p>
                    <p class="user-service" title="Postado por ${servico.userEntity?.name || 'Usuário desconhecido'}">
                        Postado por ${servico.userEntity?.name || 'Usuário desconhecido'}
                    </p>
                    <p class="service-description" title="${descricao}">
                        ${descricaoLimitada}
                    </p>
                    <div class="qty-chronos-service">
                        <img class="qty-chronos-service-img" src="/static/img/Coin.png" alt="Chronos Icon">
                        <p class="qty-chronos-service-text">${servico.timeChronos || 0} chronos</p>
                    </div>
                    <div class="categories-service">
                        ${categoriasHTML}
                    </div>
                </div>
            `;

            requestsContainer.appendChild(card);
        });

        // Preenche espaços vazios se houver menos de 4 cards na última linha
        const cardsRestantes = 4 - (servicos.length % 4);
        if (cardsRestantes > 0 && cardsRestantes < 4) {
            for (let i = 0; i < cardsRestantes; i++) {
                const emptyCard = document.createElement("div");
                emptyCard.className = "service-card";
                emptyCard.style.visibility = "hidden"; // Esconde mas mantém o espaço
                requestsContainer.appendChild(emptyCard);
            }
        }
    }

    // ----- FETCH DE SERVIÇOS -----
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
            exibirServicos([]);
            return;
        }

        // Armazena todos os serviços nas variáveis globais
        todosServicos = servicos;
        servicosFiltrados = [...servicos]; // Inicialmente mostra todos
        
        // Exibe todos os serviços inicialmente
        exibirServicos(servicosFiltrados);
    })
    .catch(error => {
        console.error("Erro completo ao carregar serviços:", error);
        exibirServicos([]);
    });
});