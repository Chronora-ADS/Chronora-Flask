// Main.js
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("auth_token");

    // ----- CARREGAR SALDO DO USUÁRIO -----
    async function loadUserChronos() {
        if (!token) return;
        try {
            const response = await fetch("/user/get", {
                headers: { "Authorization": "Bearer " + token }
            });
            if (response.ok) {
                const user = await response.json();
                const saldo = user.timeChronos ?? 0;
                document.querySelectorAll(".qty-chronos-text").forEach(el => {
                    el.textContent = saldo;
                });
                document.getElementById("modal-chronos-value").textContent = saldo;
                localStorage.setItem("user_chronos", saldo);
                localStorage.setItem("user_name", user.name || "");
            }
        } catch (e) {
            console.error("Erro ao carregar Chronos:", e);
        }
    }
    loadUserChronos();

    // ----- SIDE DRAWER -----
    const drawer = document.getElementById("side-drawer");
    const drawerOverlay = document.getElementById("drawer-overlay");
    const btnOpenDrawer = document.getElementById("btn-open-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-drawer");

    function openDrawer() {
        drawer.classList.add("open");
        drawerOverlay.classList.add("visible");
    }
    function closeDrawer() {
        drawer.classList.remove("open");
        drawerOverlay.classList.remove("visible");
    }
    if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", openDrawer);
    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

    document.getElementById("drawer-logout")?.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_chronos");
        window.location.href = "/";
    });

    // ----- WALLET MODAL -----
    const walletModal = document.getElementById("wallet-modal");
    const btnOpenWallet = document.getElementById("btn-open-wallet");
    const btnCloseModal = document.getElementById("btn-close-modal");

    if (btnOpenWallet) btnOpenWallet.addEventListener("click", function () {
        walletModal.classList.add("visible");
    });
    if (btnCloseModal) btnCloseModal.addEventListener("click", function () {
        walletModal.classList.remove("visible");
    });
    walletModal?.addEventListener("click", function (e) {
        if (e.target === walletModal) walletModal.classList.remove("visible");
    });

    // ----- VARIÁVEIS GLOBAIS -----
    let todosServicos = [];
    let servicosFiltrados = [];
    let categoriaAtual = null;
    let tempoAtual = null;
    let avaliacaoAtual = 4;
    let modalidadeAtual = "";

    const selectAvaliacao = document.getElementById("filtro-avaliacao");
    if (selectAvaliacao) {
        selectAvaliacao.addEventListener("change", function () {
            avaliacaoAtual = this.value === "" ? null : parseFloat(this.value);
            aplicarFiltrosCombinados();
        });
    }

    const selectTempo = document.getElementById("filtro-tempo-select");
    if (selectTempo) {
        function atualizarTempoPorSelect() {
            if (!selectTempo.value) {
                tempoAtual = null;
            } else {
                const [min, max] = selectTempo.value.split("-").map(Number);
                tempoAtual = { min, max };
            }
            aplicarFiltrosCombinados();
        }
        selectTempo.addEventListener("change", atualizarTempoPorSelect);
        const [min, max] = selectTempo.value.split("-").map(Number);
        tempoAtual = { min, max };
    }

    // ----- FILTRO DE MODALIDADE -----
    const selectModalidade = document.getElementById("filtro-modalidade");
    if (selectModalidade) {
        selectModalidade.addEventListener("change", function () {
            modalidadeAtual = this.value;
            aplicarFiltrosCombinados();
        });
    }

    // ----- SLIDER E TOOLTIP -----
    const slider = document.getElementById("tempo-slider");
    const tooltip = document.getElementById("tooltip");
    const btnAplicarTempo = document.getElementById("btn-aplicar-tempo");
    const btnLimparTempo = document.getElementById("btn-limpar-tempo");
    const tempoSelecionadoDiv = document.getElementById("tempo-selecionado");

    function updateTooltip() {
        if (!slider || !tooltip) return;
        const val = parseInt(slider.value);
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        let minTempo = val === 5 ? 0 : val - 5;
        let maxTempo = val;
        tooltip.textContent = `${minTempo}-${maxTempo}`;
        const sliderWidth = slider.offsetWidth;
        const thumbWidth = 16;
        const percent = (val - min) / (max - min);
        const pos = percent * (sliderWidth - thumbWidth) + (thumbWidth / 2);
        const tooltipWidth = tooltip.offsetWidth;
        tooltip.style.left = `calc(${pos}px - ${tooltipWidth / 2}px)`;
    }

    function ajustarValorSlider() {
        if (!slider) return;
        let valor = parseInt(slider.value);
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const step = 5;
        valor = Math.round(valor / step) * step;
        if (valor < min) valor = min;
        if (valor > max) valor = max;
        slider.value = valor;
        updateTooltip();
    }

    function getIntervaloTempo() {
        if (!slider) return { min: 0, max: 5 };
        const val = parseInt(slider.value);
        return { min: val === 5 ? 0 : val - 5, max: val };
    }

    function atualizarBotaoLimparTempo() {
        if (btnLimparTempo) {
            tempoAtual ? btnLimparTempo.classList.add("visivel") : btnLimparTempo.classList.remove("visivel");
        }
    }

    function filtrarPorTempo(intervalo) {
        if (!intervalo) {
            tempoAtual = null;
            if (tempoSelecionadoDiv) { tempoSelecionadoDiv.textContent = ""; tempoSelecionadoDiv.classList.remove("ativa"); }
        } else {
            tempoAtual = intervalo;
            if (tempoSelecionadoDiv) { tempoSelecionadoDiv.textContent = `Filtrando por: ${intervalo.min}-${intervalo.max} chronos`; tempoSelecionadoDiv.classList.add("ativa"); }
        }
        atualizarBotaoLimparTempo();
        aplicarFiltrosCombinados();
    }

    if (slider && tooltip) {
        slider.addEventListener("input", function () { ajustarValorSlider(); updateTooltip(); });
        slider.addEventListener("change", function () { ajustarValorSlider(); updateTooltip(); });
        window.addEventListener("resize", updateTooltip);
        ajustarValorSlider();
        updateTooltip();
    }
    if (btnAplicarTempo) btnAplicarTempo.addEventListener("click", function () { filtrarPorTempo(getIntervaloTempo()); });
    if (btnLimparTempo) btnLimparTempo.addEventListener("click", function () { filtrarPorTempo(null); });

    // ----- FILTRAGEM POR CATEGORIA -----
    const inputCategoria = document.getElementById("filtro-categorias");
    const btnLimparCategoria = document.getElementById("btn-limpar-categoria");
    const categoriaSelecionadaDiv = document.getElementById("categoria-selecionada");

    function atualizarBotaoLimpar() {
        if (btnLimparCategoria && inputCategoria) {
            (inputCategoria.value.trim() !== "" || categoriaAtual) ? btnLimparCategoria.classList.add("visivel") : btnLimparCategoria.classList.remove("visivel");
        }
    }

    function filtrarPorCategoria(categoriaNome) {
        if (!categoriaNome || categoriaNome.trim() === "") {
            categoriaAtual = null;
            if (categoriaSelecionadaDiv) { categoriaSelecionadaDiv.textContent = ""; categoriaSelecionadaDiv.classList.remove("ativa"); }
        } else {
            categoriaAtual = categoriaNome;
            if (categoriaSelecionadaDiv) { categoriaSelecionadaDiv.textContent = `Filtrando por: ${categoriaNome}`; categoriaSelecionadaDiv.classList.add("ativa"); }
        }
        atualizarBotaoLimpar();
        aplicarFiltrosCombinados();
    }

    if (inputCategoria) {
        inputCategoria.addEventListener("keydown", function (e) {
            if (e.key === "Enter") { e.preventDefault(); const cat = inputCategoria.value.trim(); if (cat) filtrarPorCategoria(cat); }
        });
        inputCategoria.addEventListener("input", function () {
            atualizarBotaoLimpar();
            if (this.value.trim() === "" && categoriaAtual) filtrarPorCategoria("");
        });
        inputCategoria.addEventListener("change", function () {
            const cat = inputCategoria.value.trim();
            if (cat) setTimeout(() => filtrarPorCategoria(cat), 100);
        });
    }

    if (btnLimparCategoria) {
        btnLimparCategoria.addEventListener("click", function () {
            inputCategoria.value = "";
            filtrarPorCategoria("");
            inputCategoria.focus();
        });
        atualizarBotaoLimpar();
    }

    // ----- ORDENAÇÃO -----
    const selectOrdenacao = document.getElementById("filtro-ordenacao");

    function ordenarServicos(servicos, opcao) {
        const s = [...servicos];
        switch (opcao) {
            case "0": return s;
            case "1": return s.reverse();
            case "2": return s.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case "3": return s.sort((a, b) => (b.timeChronos || 0) - (a.timeChronos || 0));
            case "4": return s.sort((a, b) => (a.timeChronos || 0) - (b.timeChronos || 0));
            case "5": return s.sort((a, b) => new Date(a.deadline || "9999-12-31") - new Date(b.deadline || "9999-12-31"));
            case "6": return s.sort((a, b) => new Date(b.deadline || "0000-01-01") - new Date(a.deadline || "0000-01-01"));
            default: return s;
        }
    }

    if (selectOrdenacao) {
        selectOrdenacao.addEventListener("change", function () {
            if (servicosFiltrados.length > 0) {
                exibirServicos(ordenarServicos(servicosFiltrados, this.value));
            }
        });
    }

    // ----- PESQUISA -----
    const inputSearchBar = document.getElementById("input-search-bar");

    function filtrarServicosPorTermo(termo) {
        if (!termo || termo.trim() === "") { aplicarFiltrosCombinados(); return; }
        const termoLC = termo.toLowerCase().trim();
        let lista = [...todosServicos];
        if (categoriaAtual) {
            lista = lista.filter(s => s.categoryEntities?.some(c => c.name?.toLowerCase().includes(categoriaAtual.toLowerCase())));
        }
        if (tempoAtual) {
            lista = lista.filter(s => (s.timeChronos || 0) >= tempoAtual.min && (s.timeChronos || 0) <= tempoAtual.max);
        }
        if (modalidadeAtual) {
            lista = lista.filter(s => s.modality === modalidadeAtual);
        }
        servicosFiltrados = lista.filter(s => (s.title || "").toLowerCase().includes(termoLC) || (s.description || "").toLowerCase().includes(termoLC));
        if (selectOrdenacao && selectOrdenacao.value !== "0") {
            servicosFiltrados = ordenarServicos(servicosFiltrados, selectOrdenacao.value);
        }
        exibirServicos(servicosFiltrados);
    }

    if (inputSearchBar) {
        let timeoutId;
        inputSearchBar.addEventListener("input", function () {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => filtrarServicosPorTermo(this.value), 300);
        });
        inputSearchBar.addEventListener("keydown", function (e) {
            if (e.key === "Enter") filtrarServicosPorTermo(this.value);
        });
        const searchIcon = document.querySelector(".icon-search");
        if (searchIcon) searchIcon.addEventListener("click", function () { filtrarServicosPorTermo(inputSearchBar.value); });
    }

    // ----- FILTROS COMBINADOS -----
    function aplicarFiltrosCombinados() {
        let lista = [...todosServicos];
        if (categoriaAtual) {
            lista = lista.filter(s => s.categoryEntities?.some(c => c.name?.toLowerCase().includes(categoriaAtual.toLowerCase())));
        }
        if (tempoAtual) {
            lista = lista.filter(s => (s.timeChronos || 0) >= tempoAtual.min && (s.timeChronos || 0) <= tempoAtual.max);
        }
        if (modalidadeAtual) {
            lista = lista.filter(s => s.modality === modalidadeAtual);
        }
        if (avaliacaoAtual) {
            lista = lista.filter(s => (s.userEntity?.rating || s.rating || 4.9) >= avaliacaoAtual);
        }
        const termoBusca = inputSearchBar?.value;
        if (termoBusca && termoBusca.trim() !== "") {
            const termoLC = termoBusca.toLowerCase().trim();
            lista = lista.filter(s => (s.title || "").toLowerCase().includes(termoLC) || (s.description || "").toLowerCase().includes(termoLC));
        }
        servicosFiltrados = lista;
        if (selectOrdenacao && selectOrdenacao.value !== "0") {
            servicosFiltrados = ordenarServicos(servicosFiltrados, selectOrdenacao.value);
        }
        exibirServicos(servicosFiltrados);
    }

    // ----- EXIBIÇÃO DE SERVIÇOS -----
    const requestsContainer = document.getElementById("requests");

    function extrairCategoriasUnicas(servicos) {
        const cats = new Set();
        servicos.forEach(s => s.categoryEntities?.forEach(c => { if (c.name) cats.add(c.name); }));
        return Array.from(cats).sort();
    }

    function popularCategoriasDatalist(servicos) {
        const datalist = document.getElementById("categorias-lista");
        if (!datalist) return;
        datalist.innerHTML = "";
        extrairCategoriasUnicas(servicos).forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            datalist.appendChild(opt);
        });
    }

    function formatarData(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("pt-BR");
    }

    function exibirServicos(servicos) {
        if (!requestsContainer) return;
        requestsContainer.innerHTML = "";

        if (!servicos || servicos.length === 0) {
            const msg = document.createElement("div");
            msg.className = "no-results-message";
            let texto = "Nenhum serviço encontrado";
            const filtros = [];
            if (categoriaAtual) filtros.push(`categoria "${categoriaAtual}"`);
            if (tempoAtual) filtros.push(`tempo ${tempoAtual.min}-${tempoAtual.max} chronos`);
            if (modalidadeAtual) filtros.push(`modalidade "${modalidadeAtual}"`);
            const termoBusca = inputSearchBar?.value;
            if (termoBusca && termoBusca.trim() !== "") filtros.push(`busca "${termoBusca}"`);
            if (filtros.length > 0) texto += ` com ${filtros.join(" e ")}`;
            texto += ".";
            msg.textContent = texto;
            requestsContainer.appendChild(msg);
            return;
        }

        requestsContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
        requestsContainer.style.gap = "20px";

        servicos.forEach(servico => {
            const card = document.createElement("div");
            card.className = "service-card";
            card.style.width = "100%";
            card.style.cursor = "pointer";

            let imageSrc = "/static/img/default-service.png";
            if (servico.serviceImage && typeof servico.serviceImage === "string") {
                imageSrc = `data:image/png;base64,${servico.serviceImage}`;
            }

            const titulo = servico.title || "Sem título";
            const tituloLimitado = titulo.length > 25 ? titulo.substring(0, 25) + "..." : titulo;
            const descricao = servico.description || "";
            const descricaoLimitada = descricao.length > 60 ? descricao.substring(0, 60) + "..." : descricao;
            const tempoServico = servico.timeChronos || 0;
            let classeTempoDestaque = "";
            if (tempoAtual && tempoServico >= tempoAtual.min && tempoServico <= tempoAtual.max) {
                classeTempoDestaque = " tempo-destaque";
            }

            let categoriasHTML = "";
            if (servico.categoryEntities && servico.categoryEntities.length > 0) {
                categoriasHTML = servico.categoryEntities.slice(0, 3).map(cat => {
                    const nome = cat.name || "Categoria";
                    let classeExtra = "";
                    if (categoriaAtual && nome.toLowerCase().includes(categoriaAtual.toLowerCase())) classeExtra = " categoria-destaque";
                    const nomeExibicao = nome.substring(0, 12) + (nome.length > 12 ? "..." : "");
                    return `<div class="category-service${classeExtra}" title="${nome}"><img class="category-service-img" src="/static/img/Paintbrush.png" alt=""><p class="category-service-text">${nomeExibicao}</p></div>`;
                }).join("");
            } else {
                categoriasHTML = '<div class="category-service"><p class="category-service-text">Sem categorias</p></div>';
            }

            const prazoStr = servico.deadline ? `<p class="service-deadline">Prazo: ${formatarData(servico.deadline)}</p>` : "";
            const modalidadeStr = servico.modality ? `<span class="badge-modality badge-${servico.modality.toLowerCase().replace('í','i')}">${servico.modality}</span>` : "";

            card.innerHTML = `
                <img src="${imageSrc}" alt="Imagem do Serviço" class="service-image">
                <div class="service-info">
                    <p class="service-title" title="${servico.title || ""}">${tituloLimitado}</p>
                    <p class="user-service" title="Postado por ${servico.userEntity?.name || 'Usuário desconhecido'}">
                        Postado por ${servico.userEntity?.name || "Usuário desconhecido"}
                    </p>
                    <p class="service-description" title="${descricao}">${descricaoLimitada}</p>
                    ${prazoStr}
                    ${modalidadeStr}
                    <div class="qty-chronos-service${classeTempoDestaque}">
                        <img class="qty-chronos-service-img" src="/static/img/Coin.png" alt="">
                        <p class="qty-chronos-service-text">${tempoServico} chronos</p>
                    </div>
                    <div class="categories-service">${categoriasHTML}</div>
                </div>
            `;

            card.addEventListener("click", function () {
                window.location.href = `/view_service?id=${servico.id}`;
            });

            requestsContainer.appendChild(card);
        });

        const cardsRestantes = 4 - (servicos.length % 4);
        if (cardsRestantes > 0 && cardsRestantes < 4) {
            for (let i = 0; i < cardsRestantes; i++) {
                const emptyCard = document.createElement("div");
                emptyCard.className = "service-card";
                emptyCard.style.visibility = "hidden";
                requestsContainer.appendChild(emptyCard);
            }
        }
    }

    // ----- FETCH DE SERVIÇOS -----
    if (!requestsContainer) { console.error("Elemento #requests não encontrado."); return; }

    if (!token) {
        requestsContainer.innerHTML = "<p style='color: white;'>Você precisa estar logado para visualizar os serviços.</p>";
        return;
    }

    fetch("/service/get/all", {
        method: "GET",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }
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
        if (!servicos || servicos.length === 0) { exibirServicos([]); return; }
        todosServicos = servicos;
        servicosFiltrados = [...servicos];
        popularCategoriasDatalist(servicos);
        atualizarBotaoLimpar();
        atualizarBotaoLimparTempo();
        if (selectOrdenacao && selectOrdenacao.value !== "0") {
            servicosFiltrados = ordenarServicos(servicosFiltrados, selectOrdenacao.value);
        }
        if (inputSearchBar && inputSearchBar.value.trim() !== "") {
            setTimeout(() => filtrarServicosPorTermo(inputSearchBar.value), 100);
        } else {
            exibirServicos(servicosFiltrados);
        }
    })
    .catch(error => {
        console.error("Erro ao carregar serviços:", error);
        exibirServicos([]);
    });
});
