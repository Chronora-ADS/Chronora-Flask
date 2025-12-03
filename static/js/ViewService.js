// ViewService.js - Descrição começa ao lado da imagem e continua abaixo

document.addEventListener("DOMContentLoaded", function () {
    // --- Obter ID do serviço da URL ---
    function getServiceIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // --- Carregar dados do serviço ---
    async function loadServiceData(serviceId) {
        const token = localStorage.getItem("auth_token");
        
        if (!token) {
            alert("Você precisa estar logado para ver os detalhes do serviço.");
            window.location.href = "http://127.0.0.1:5000/";
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/service/get/${serviceId}`, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert("Sessão expirada. Faça login novamente.");
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_id");
                    window.location.href = "http://127.0.0.1:5000/";
                    return;
                }
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const serviceData = await response.json();
            console.log("Dados do serviço:", serviceData);
            updateServiceUI(serviceData);

        } catch (error) {
            console.error("Erro ao carregar serviço:", error);
            alert("Erro ao carregar os dados do serviço.");
        }
    }

    // --- Atualizar a interface com os dados do serviço ---
    function updateServiceUI(serviceData) {
        // Título do serviço
        const titleElement = document.getElementById('service-title');
        if (titleElement && serviceData.title) {
            titleElement.textContent = serviceData.title;
        }

        // Imagem do serviço
        const serviceImage = document.getElementById('service-image');
        if (serviceImage && serviceData.serviceImage) {
            serviceImage.src = `data:image/png;base64,${serviceData.serviceImage}`;
            serviceImage.alt = serviceData.title || 'Imagem do Serviço';
        }

        // Quantidade de chronos
        const chronosValueElement = document.getElementById('chronos-value');
        if (chronosValueElement && serviceData.timeChronos) {
            chronosValueElement.textContent = serviceData.timeChronos;
        }

        // Tempo de postagem
        const postTimeElement = document.getElementById('post-time');
        if (postTimeElement) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            postTimeElement.textContent = `${hours}:${minutes}`;
        }

        // DESCRIÇÃO - dividida em duas partes
        if (serviceData.description) {
            const description = serviceData.description.trim();
            
            // PRIMEIRA LINHA (ao lado da imagem) - apenas a primeira frase
            const firstLineElement = document.getElementById('description-first-line');
            if (firstLineElement) {
                // Encontra o primeiro ponto final
                const firstPeriodIndex = description.indexOf('.');
                
                if (firstPeriodIndex > 0) {
                    // Pega a primeira frase (até o primeiro ponto)
                    const firstSentence = description.substring(0, firstPeriodIndex + 1);
                    firstLineElement.innerHTML = `<strong>${firstSentence}</strong>`;
                    
                    // CONTINUAÇÃO (abaixo da imagem) - todo o restante
                    const continuationElement = document.getElementById('description-continuation-full');
                    if (continuationElement) {
                        const continuationText = description.substring(firstPeriodIndex + 1).trim();
                        continuationElement.textContent = continuationText;
                    }
                } else {
                    // Se não há ponto, mostra tudo na primeira linha
                    firstLineElement.innerHTML = `<strong>${description}</strong>`;
                    
                    // Esconde a continuação
                    const continuationElement = document.getElementById('description-continuation-full');
                    if (continuationElement) {
                        continuationElement.style.display = 'none';
                    }
                }
            }
        }

        // Categorias
        const categoriesContainer = document.getElementById('categories-container');
        if (categoriesContainer && serviceData.categoryEntities) {
            categoriesContainer.innerHTML = '';
            
            serviceData.categoryEntities.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-item';
                categoryElement.innerHTML = `
                    <img src="/static/img/Paintbrush.png" alt="Ícone Categoria">
                    <span>${category.name || 'Categoria'}</span>
                `;
                categoriesContainer.appendChild(categoryElement);
            });
        } else if (categoriesContainer) {
            // Se não há categorias
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            categoryElement.innerHTML = `
                <img src="/static/img/Paintbrush.png" alt="Ícone Categoria">
                <span>Sem categorias</span>
            `;
            categoriesContainer.appendChild(categoryElement);
        }

        // Informações do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && serviceData.userEntity && serviceData.userEntity.name) {
            userNameElement.textContent = serviceData.userEntity.name;
        }

        // Avaliação do usuário
        const userRatingElement = document.getElementById('user-rating');
        if (userRatingElement) {
            userRatingElement.textContent = "4.9";
        }
    }

    // --- Lógica do botão de aceitar pedido ---
    const acceptButton = document.getElementById('btn-accept-request');
    if (acceptButton) {
        acceptButton.addEventListener('click', async function() {
            const serviceId = getServiceIdFromURL();
            const token = localStorage.getItem("auth_token");
            const userId = localStorage.getItem("user_id");
            
            if (!serviceId) {
                alert("ID do serviço não encontrado.");
                return;
            }

            if (!token || !userId) {
                alert("Você precisa estar logado para aceitar um pedido.");
                window.location.href = "http://127.0.0.1:5000/";
                return;
            }

            // Confirmação do usuário
            const confirmed = confirm("Tem certeza que deseja aceitar este pedido?");
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/service/accept/${serviceId}`, {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId: userId })
                });

                if (response.ok) {
                    alert("Pedido aceito com sucesso!");
                    window.location.href = "http://127.0.0.1:5000/home";
                } else if (response.status === 404) {
                    alert("Funcionalidade de aceitar pedido será implementada em breve!");
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao aceitar pedido: ${errorData.error || "Erro desconhecido"}`);
                }
            } catch (error) {
                console.error("Erro ao aceitar pedido:", error);
                alert("Funcionalidade de aceitar pedido será implementada em breve!");
            }
        });
    }

    // --- Barra de pesquisa ---
    const inputSearchBar = document.getElementById('input-search-bar');
    if (inputSearchBar) {
        inputSearchBar.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    window.location.href = `http://127.0.0.1:5000/home?search=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        if (searchParam) {
            inputSearchBar.value = decodeURIComponent(searchParam);
        }
    }

    // --- Carregar os dados do serviço quando a página carregar ---
    const serviceId = getServiceIdFromURL();
    if (serviceId) {
        loadServiceData(serviceId);
    } else {
        document.getElementById('container-content').innerHTML = `
            <div style="
                text-align: center; 
                padding: 40px 20px;
                background-color: rgba(181, 191, 174, 0.1);
                border-radius: 12px;
                margin-top: 30px;
                border: 2px solid var(--amarelo-claro);
            ">
                <h2 style="color: var(--amarelo-claro); font-size: 1.6rem; margin-bottom: 12px;">
                    Serviço não encontrado
                </h2>
                <p style="color: var(--branco); margin: 12px 0; font-size: 0.95rem; line-height: 1.5;">
                    O ID do serviço não foi especificado ou é inválido.
                </p>
                <a href="http://127.0.0.1:5000/home" style="
                    display: inline-block;
                    background-color: var(--amarelo-claro);
                    color: var(--preto);
                    text-decoration: none;
                    font-weight: bold;
                    padding: 10px 30px;
                    border-radius: 20px;
                    font-size: 1rem;
                    margin-top: 20px;
                    transition: all 0.3s ease;
                " onmouseover="this.style.backgroundColor='var(--amarelo-um-pouco-escuro)'; this.style.transform='translateY(-2px)'"
                   onmouseout="this.style.backgroundColor='var(--amarelo-claro)'; this.style.transform='translateY(0)'">
                    Voltar para a página principal
                </a>
            </div>
        `;
    }

    // --- Atualizar quantidade de chronos do usuário (no header) ---
    function updateUserChronos() {
        const savedChronos = localStorage.getItem('user_chronos') || '123';
        const chronosElements = document.querySelectorAll('.qty-chronos-text');
        
        chronosElements.forEach(element => {
            element.textContent = savedChronos;
        });
    }

    // Inicializar
    updateUserChronos();
    
    // Adicionar funcionalidade ao ícone de busca
    const searchIcon = document.querySelector('.icon-search');
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            if (inputSearchBar.value.trim()) {
                window.location.href = `http://127.0.0.1:5000/home?search=${encodeURIComponent(inputSearchBar.value)}`;
            }
        });
    }
});