// Main.js
document.addEventListener("DOMContentLoaded", function () {
    // Variáveis globais para armazenar serviços
    let todosServicos = [];
    let servicosFiltrados = [];
    let categoriaAtual = null; // Armazena a categoria selecionada atualmente
    let tempoAtual = null; // Armazena o intervalo de tempo selecionado atual {min, max}

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

    // Extrai todas as categorias únicas dos serviços
    function extrairCategoriasUnicas(servicos) {
        const categorias = new Set();
        servicos.forEach(servico => {
            if (servico.categoryEntities && servico.categoryEntities.length > 0) {
                servico.categoryEntities.forEach(cat => {
                    if (cat.name) {
                        categorias.add(cat.name);
                    }
                });
            }
        });
        return Array.from(categorias).sort();
    }

    // Popular o datalist com categorias dos serviços
    function popularCategoriasDatalist(servicos) {
        const datalist = document.getElementById("categorias-lista");
        if (!datalist) return;
        
        const categorias = extrairCategoriasUnicas(servicos);
        datalist.innerHTML = "";
        
        categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            datalist.appendChild(option);
        });
        
        console.log("Categorias disponíveis:", categorias);
    }

    // ----- SLIDER E TOOLTIP -----
    const slider = document.getElementById("tempo-slider");
    const tooltip = document.getElementById("tooltip");
    const btnAplicarTempo = document.getElementById("btn-aplicar-tempo");
    const btnLimparTempo = document.getElementById("btn-limpar-tempo");
    const tempoSelecionadoDiv = document.getElementById("tempo-selecionado");

    // Atualizar tooltip com o valor atual do slider
    function updateTooltip() {
        if (!slider || !tooltip) return;

        const val = parseInt(slider.value);
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        
        // Calcula o intervalo de tempo
        let minTempo = val === 5 ? 0 : val - 5;
        let maxTempo = val;
        
        tooltip.textContent = `${minTempo}-${maxTempo}`;

        // Posicionamento da tooltip
        const sliderWidth = slider.offsetWidth;
        const thumbWidth = 16; // Tamanho reduzido da bolinha
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

    // Função para obter o intervalo de tempo do slider
    function getIntervaloTempo() {
        if (!slider) return { min: 0, max: 5 };
        
        const val = parseInt(slider.value);
        const minTempo = val === 5 ? 0 : val - 5;
        const maxTempo = val;
        
        return { min: minTempo, max: maxTempo };
    }

    // Atualizar visibilidade do botão de limpar tempo
    function atualizarBotaoLimparTempo() {
        if (btnLimparTempo) {
            if (tempoAtual) {
                btnLimparTempo.classList.add("visivel");
            } else {
                btnLimparTempo.classList.remove("visivel");
            }
        }
    }

    // Função para filtrar serviços por intervalo de tempo
    function filtrarPorTempo(intervalo) {
        if (!intervalo) {
            // Se não houver intervalo, mostra todos os serviços
            servicosFiltrados = [...todosServicos];
            tempoAtual = null;
            tempoSelecionadoDiv.textContent = "";
            tempoSelecionadoDiv.classList.remove("ativa");
            console.log("Filtro de tempo removido. Mostrando todos os serviços.");
        } else {
            // Filtra serviços que estão dentro do intervalo de tempo
            servicosFiltrados = todosServicos.filter(servico => {
                const tempoServico = servico.timeChronos || 0;
                return tempoServico >= intervalo.min && tempoServico <= intervalo.max;
            });
            
            tempoAtual = intervalo;
            tempoSelecionadoDiv.textContent = `Filtrando por: ${intervalo.min}-${intervalo.max} chronos`;
            tempoSelecionadoDiv.classList.add("ativa");
            console.log(`Filtrados ${servicosFiltrados.length} serviços pelo tempo: ${intervalo.min}-${intervalo.max} chronos`);
        }
        
        atualizarBotaoLimparTempo();
        
        // Aplica também os outros filtros se houverem
        aplicarFiltrosCombinados();
    }

    // Função para aplicar filtro de tempo quando clicar em OK
    function aplicarFiltroTempo() {
        const intervalo = getIntervaloTempo();
        filtrarPorTempo(intervalo);
    }

    // Função para limpar o filtro de tempo
    function limparFiltroTempo() {
        filtrarPorTempo(null);
    }

    // Configurar eventos para o slider de tempo
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

    // Configurar evento para o botão OK
    if (btnAplicarTempo) {
        btnAplicarTempo.addEventListener("click", aplicarFiltroTempo);
    }

    // Configurar evento para o botão X (limpar tempo)
    if (btnLimparTempo) {
        btnLimparTempo.addEventListener("click", limparFiltroTempo);
    }

    // ----- FILTRAGEM POR CATEGORIA -----
    const inputCategoria = document.getElementById("filtro-categorias");
    const btnLimparCategoria = document.getElementById("btn-limpar-categoria");
    const categoriaSelecionadaDiv = document.getElementById("categoria-selecionada");

    // Mostrar/ocultar botão X baseado no conteúdo do input
    function atualizarBotaoLimpar() {
        if (btnLimparCategoria && inputCategoria) {
            if (inputCategoria.value.trim() !== "" || categoriaAtual) {
                btnLimparCategoria.classList.add("visivel");
            } else {
                btnLimparCategoria.classList.remove("visivel");
            }
        }
    }

    // Função para filtrar serviços por categoria
    function filtrarPorCategoria(categoriaNome) {
        if (!categoriaNome || categoriaNome.trim() === "") {
            // Se não houver categoria, remove o filtro
            categoriaAtual = null;
            categoriaSelecionadaDiv.textContent = "";
            categoriaSelecionadaDiv.classList.remove("ativa");
            console.log("Filtro de categoria removido.");
        } else {
            // Define a categoria atual
            categoriaAtual = categoriaNome;
            categoriaSelecionadaDiv.textContent = `Filtrando por: ${categoriaNome}`;
            categoriaSelecionadaDiv.classList.add("ativa");
            console.log(`Filtrando pela categoria: ${categoriaNome}`);
        }
        
        atualizarBotaoLimpar();
        aplicarFiltrosCombinados();
    }

    // Função para limpar o filtro de categoria
    function limparFiltroCategoria() {
        inputCategoria.value = "";
        filtrarPorCategoria("");
        inputCategoria.focus();
    }

    // Configurar eventos para o filtro de categoria
    if (inputCategoria) {
        // Filtrar ao pressionar Enter
        inputCategoria.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault(); // Previne comportamento padrão
                const categoria = inputCategoria.value.trim();
                if (categoria) {
                    filtrarPorCategoria(categoria);
                }
            }
        });
        
        // Atualizar visibilidade do botão X enquanto digita
        inputCategoria.addEventListener("input", function() {
            atualizarBotaoLimpar();
            
            // Se o input estiver vazio e havia um filtro ativo, limpa o filtro
            if (this.value.trim() === "" && categoriaAtual) {
                filtrarPorCategoria("");
            }
        });
        
        // Filtrar também ao selecionar uma opção do datalist
        inputCategoria.addEventListener("change", function() {
            const categoria = inputCategoria.value.trim();
            if (categoria) {
                setTimeout(() => {
                    filtrarPorCategoria(categoria);
                }, 100);
            }
        });
    }

    // Configurar evento para o botão X (limpar categoria)
    if (btnLimparCategoria) {
        btnLimparCategoria.addEventListener("click", limparFiltroCategoria);
        atualizarBotaoLimpar();
    }

    // ----- PESQUISA DE SERVIÇOS -----
    const inputSearchBar = document.getElementById("input-search-bar");
    
    // Função para filtrar serviços por termo de busca
    function filtrarServicosPorTermo(termo) {
        if (!termo || termo.trim() === "") {
            aplicarFiltrosCombinados();
            return;
        }
        
        const termoLowerCase = termo.toLowerCase().trim();
        
        // Primeiro aplica filtros de categoria e tempo
        aplicarFiltrosCombinados();
        
        // Depois filtra por termo de busca nos serviços já filtrados
        const servicosComFiltros = [...servicosFiltrados];
        servicosFiltrados = servicosComFiltros.filter(servico => {
            const titulo = servico.title || '';
            const descricao = servico.description || '';
            
            // Busca no título OU na descrição
            return titulo.toLowerCase().includes(termoLowerCase) || 
                   descricao.toLowerCase().includes(termoLowerCase);
        });
        
        exibirServicos(servicosFiltrados);
    }

    // Função para aplicar todos os filtros combinados
    function aplicarFiltrosCombinados() {
        let servicosParaFiltrar = [...todosServicos];
        
        // Aplica filtro de categoria
        if (categoriaAtual) {
            servicosParaFiltrar = servicosParaFiltrar.filter(servico => {
                if (!servico.categoryEntities || servico.categoryEntities.length === 0) {
                    return false;
                }
                
                return servico.categoryEntities.some(cat => {
                    if (!cat.name) return false;
                    return cat.name.toLowerCase().includes(categoriaAtual.toLowerCase());
                });
            });
        }
        
        // Aplica filtro de tempo
        if (tempoAtual) {
            servicosParaFiltrar = servicosParaFiltrar.filter(servico => {
                const tempoServico = servico.timeChronos || 0;
                return tempoServico >= tempoAtual.min && tempoServico <= tempoAtual.max;
            });
        }
        
        servicosFiltrados = servicosParaFiltrar;
        
        // Aplica filtro de busca se houver
        const termoBusca = inputSearchBar?.value;
        if (termoBusca && termoBusca.trim() !== "") {
            filtrarServicosPorTermo(termoBusca);
        } else {
            exibirServicos(servicosFiltrados);
        }
    }

    // Adiciona evento de input para a barra de pesquisa
    if (inputSearchBar) {
        // Pesquisa enquanto digita (com debounce para performance)
        let timeoutId;
        inputSearchBar.addEventListener("input", function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                filtrarServicosPorTermo(this.value);
            }, 300);
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
            
            let mensagemTexto = "Nenhum serviço encontrado";
            const filtrosAtivos = [];
            
            if (categoriaAtual) filtrosAtivos.push(`categoria "${categoriaAtual}"`);
            if (tempoAtual) filtrosAtivos.push(`tempo ${tempoAtual.min}-${tempoAtual.max} chronos`);
            
            const termoBusca = inputSearchBar?.value;
            if (termoBusca && termoBusca.trim() !== "") {
                filtrosAtivos.push(`busca "${termoBusca}"`);
            }
            
            if (filtrosAtivos.length > 0) {
                mensagemTexto += ` com ${filtrosAtivos.join(" e ")}`;
            }
            mensagemTexto += ".";
            
            mensagem.textContent = mensagemTexto;
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

            // Obtém o tempo do serviço
            const tempoServico = servico.timeChronos || 0;
            
            // Verifica se o tempo está dentro do filtro (para destaque)
            let classeTempoDestaque = '';
            if (tempoAtual && tempoServico >= tempoAtual.min && tempoServico <= tempoAtual.max) {
                classeTempoDestaque = ' tempo-destaque';
            }

            // Limita categorias (máximo 3) e destaca a categoria filtrada
            let categoriasHTML = '';
            if (servico.categoryEntities && servico.categoryEntities.length > 0) {
                const categoriasLimitadas = servico.categoryEntities.slice(0, 3); // Máximo 3 categorias
                categoriasHTML = categoriasLimitadas.map(cat => {
                    const categoriaNome = cat.name || 'Categoria';
                    let classeExtra = '';
                    
                    // Destaca a categoria que está sendo filtrada
                    if (categoriaAtual && categoriaNome.toLowerCase().includes(categoriaAtual.toLowerCase())) {
                        classeExtra = ' categoria-destaque';
                    }
                    
                    const nomeExibicao = categoriaNome.substring(0, 12) + (categoriaNome.length > 12 ? '...' : '');
                    return `
                        <div class="category-service${classeExtra}" title="${categoriaNome}">
                            <img class="category-service-img" src="/static/img/Paintbrush.png" alt="Category Icon">
                            <p class="category-service-text">${nomeExibicao}</p>
                        </div>
                    `;
                }).join('');
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
                    <div class="qty-chronos-service${classeTempoDestaque}">
                        <img class="qty-chronos-service-img" src="/static/img/Coin.png" alt="Chronos Icon">
                        <p class="qty-chronos-service-text">${tempoServico} chronos</p>
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
        
        // Popular o datalist com as categorias dos serviços
        popularCategoriasDatalist(servicos);
        
        // Inicializa botões
        atualizarBotaoLimpar();
        atualizarBotaoLimparTempo();
        
        // Exibe todos os serviços inicialmente
        exibirServicos(servicosFiltrados);
    })
    .catch(error => {
        console.error("Erro completo ao carregar serviços:", error);
        exibirServicos([]);
    });
});