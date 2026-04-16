// ViewService.js
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("auth_token");
    const serviceId = new URLSearchParams(window.location.search).get('id');

    // --- Saldo do usuário no header ---
    async function loadUserChronos() {
        if (!token) return;
        try {
            const res = await fetch("/user/get", { headers: { "Authorization": "Bearer " + token } });
            if (res.ok) {
                const user = await res.json();
                const el = document.getElementById('user-chronos-display');
                if (el) el.textContent = user.timeChronos ?? 0;
            }
        } catch (e) { console.error(e); }
    }
    loadUserChronos();

    // --- Carregar dados do serviço ---
    async function loadServiceData(id) {
        if (!token) {
            alert("Você precisa estar logado para ver os detalhes do serviço.");
            window.location.href = "/";
            return;
        }
        try {
            const res = await fetch(`/service/get/${id}`, {
                headers: { "Authorization": "Bearer " + token }
            });
            if (!res.ok) {
                if (res.status === 401) {
                    alert("Sessão expirada. Faça login novamente.");
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_id");
                    window.location.href = "/";
                    return;
                }
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            renderService(data);
        } catch (err) {
            console.error("Erro ao carregar serviço:", err);
            alert("Erro ao carregar os dados do serviço.");
        }
    }

    // --- Renderizar serviço ---
    function renderService(d) {
        // Título
        const titleEl = document.getElementById('service-title');
        if (titleEl) titleEl.textContent = d.title || '—';

        // Imagem
        const imgEl = document.getElementById('service-image');
        if (imgEl && d.serviceImage) {
            imgEl.src = `data:image/png;base64,${d.serviceImage}`;
            imgEl.alt = d.title || 'Imagem do pedido';
        }

        // Descrição
        const descEl = document.getElementById('service-description');
        if (descEl) descEl.textContent = d.description || '—';

        // Chronos
        const chronosEl = document.getElementById('chronos-value');
        if (chronosEl) chronosEl.textContent = d.timeChronos ?? '—';

        // Hora de postagem
        const postTimeEl = document.getElementById('post-time');
        if (postTimeEl) {
            const now = new Date();
            postTimeEl.textContent = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        }

        // Categorias
        const catContainer = document.getElementById('categories-container');
        if (catContainer) {
            catContainer.innerHTML = '';
            const cats = d.categoryEntities || [];
            if (cats.length === 0) {
                catContainer.innerHTML = `<span class="vs-category-tag"><img src="/static/img/Paintbrush.png" alt="">Sem categorias</span>`;
            } else {
                cats.forEach(cat => {
                    const span = document.createElement('span');
                    span.className = 'vs-category-tag';
                    span.innerHTML = `<img src="/static/img/Paintbrush.png" alt="">${cat.name || 'Categoria'}`;
                    catContainer.appendChild(span);
                });
            }
        }

        // Usuário
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = d.userEntity?.name || '—';

        // Prazo e modalidade
        const metaBox = document.getElementById('service-meta-box');
        const deadlineLine = document.getElementById('service-deadline-line');
        const modalityLine = document.getElementById('service-modality-line');
        let showMeta = false;
        if (d.deadline && deadlineLine) {
            const dt = new Date(d.deadline + 'T00:00:00');
            deadlineLine.textContent = `Prazo: ${dt.toLocaleDateString('pt-BR')}`;
            showMeta = true;
        }
        if (d.modality && modalityLine) {
            modalityLine.textContent = `Modalidade: ${d.modality}`;
            showMeta = true;
        }
        if (showMeta && metaBox) metaBox.style.display = 'block';

        // Botões do dono
        const currentUserId = parseInt(localStorage.getItem('user_id'));
        const ownerActions = document.getElementById('owner-actions');
        const acceptBtn = document.getElementById('btn-accept-request');
        if (d.userEntity && d.userEntity.id === currentUserId) {
            if (ownerActions) ownerActions.style.display = 'flex';
            if (acceptBtn) acceptBtn.style.display = 'none';
        }
    }

    // --- Aceitar pedido ---
    document.getElementById('btn-accept-request')?.addEventListener('click', async function () {
        if (!serviceId) { alert("ID do serviço não encontrado."); return; }
        if (!token) { alert("Você precisa estar logado para aceitar um pedido."); window.location.href = "/"; return; }
        if (!confirm("Tem certeza que deseja aceitar este pedido?")) return;
        try {
            const res = await fetch(`/service/accept/${serviceId}`, {
                method: "POST",
                headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
                body: JSON.stringify({ userId: localStorage.getItem("user_id") })
            });
            if (res.ok) { alert("Pedido aceito com sucesso!"); window.location.href = "/home"; }
            else { const err = await res.json(); alert(`Erro: ${err.error || "Erro desconhecido"}`); }
        } catch (e) {
            console.error(e);
            alert("Funcionalidade de aceitar pedido será implementada em breve!");
        }
    });

    // --- Editar ---
    document.getElementById('btn-edit-service')?.addEventListener('click', function () {
        window.location.href = `/edit_service?id=${serviceId}`;
    });

    // --- Excluir ---
    document.getElementById('btn-delete-service')?.addEventListener('click', async function () {
        if (!confirm('Deseja realmente excluir este pedido?')) return;
        try {
            const res = await fetch(`/service/delete/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) { alert('Pedido excluído com sucesso!'); window.location.href = '/home'; }
            else { const err = await res.json(); alert(`Erro: ${err.error || 'Não foi possível excluir.'}`); }
        } catch (e) { console.error(e); alert('Erro ao excluir o pedido.'); }
    });

    // --- Barra de pesquisa ---
    const searchInput = document.getElementById('input-search-bar');
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && this.value.trim())
                window.location.href = `/home?search=${encodeURIComponent(this.value.trim())}`;
        });
        document.querySelector('.icon-search')?.addEventListener('click', function () {
            if (searchInput.value.trim())
                window.location.href = `/home?search=${encodeURIComponent(searchInput.value.trim())}`;
        });
    }

    // --- Init ---
    if (serviceId) {
        loadServiceData(serviceId);
    } else {
        document.getElementById('vs-wrapper').innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#fff;">
                <h2 style="color:var(--amarelo-claro);">Serviço não encontrado</h2>
                <p style="color:rgba(255,255,255,0.6);margin:12px 0;">O ID do serviço não foi especificado.</p>
                <a href="/home" style="display:inline-block;background:var(--amarelo-claro);color:#000;text-decoration:none;font-weight:bold;padding:10px 30px;border-radius:30px;margin-top:16px;">Voltar ao início</a>
            </div>`;
    }
});
