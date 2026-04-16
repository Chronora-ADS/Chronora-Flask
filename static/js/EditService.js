// EditService.js
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("auth_token");
    const serviceId = new URLSearchParams(window.location.search).get('id');

    if (!token) { window.location.href = "/"; return; }
    if (!serviceId) { alert("ID do serviço não encontrado."); window.location.href = "/home"; return; }

    // Link de cancelar aponta para o serviço
    document.getElementById("btn-cancel").href = `/view_service?id=${serviceId}`;

    // Carregar saldo
    async function loadBalance() {
        try {
            const res = await fetch("/user/get", { headers: { "Authorization": "Bearer " + token } });
            if (res.ok) {
                const user = await res.json();
                document.querySelectorAll(".qty-chronos-text").forEach(el => el.textContent = user.timeChronos ?? 0);
            }
        } catch (e) { console.error(e); }
    }
    loadBalance();

    // Carregar dados do serviço
    let originalImageBase64 = null;
    try {
        const res = await fetch(`/service/get/${serviceId}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Serviço não encontrado");
        const data = await res.json();

        document.getElementById("input-title").value = data.title || "";
        document.getElementById("input-description").value = data.description || "";
        document.getElementById("input-time-chronos").value = data.timeChronos || "";
        if (data.deadline) document.getElementById("input-deadline").value = data.deadline;
        if (data.modality) document.getElementById("input-modality").value = data.modality;

        // Categorias
        const tagList = document.getElementById("category-tag-list");
        (data.categoryEntities || []).forEach(cat => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `${cat.name}<span class="remove-tag" onclick="this.parentElement.remove()">×</span>`;
            tagList.appendChild(tag);
        });

        originalImageBase64 = data.serviceImage;
    } catch (err) {
        alert("Erro ao carregar serviço.");
        window.location.href = "/home";
        return;
    }

    // Botão de imagem
    const imageInput = document.getElementById("input-service-image");
    const imageButton = document.getElementById("btn-service-image");
    if (imageButton) imageButton.addEventListener("click", () => imageInput.click());
    if (imageInput) {
        imageInput.addEventListener("change", function () {
            document.getElementById("service-image-chosen").textContent = this.files[0]?.name || "";
        });
    }

    // Tags de categoria
    const categoryInput = document.getElementById("input-category");
    const tagList = document.getElementById("category-tag-list");
    if (categoryInput && tagList) {
        categoryInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && this.value.trim()) {
                e.preventDefault();
                const tag = document.createElement("span");
                tag.className = "tag";
                tag.innerHTML = `${this.value.trim()}<span class="remove-tag" onclick="this.parentElement.remove()">×</span>`;
                tagList.appendChild(tag);
                this.value = "";
            }
        });
    }

    // Envio do formulário
    document.getElementById("register-form").addEventListener("submit", async function (e) {
        e.preventDefault();

        const title = document.getElementById("input-title").value.trim();
        const description = document.getElementById("input-description").value.trim();
        const timeChronos = parseInt(document.getElementById("input-time-chronos").value);
        const deadline = document.getElementById("input-deadline").value || null;
        const modality = document.getElementById("input-modality").value || null;

        if (!title || !description || !timeChronos) {
            alert("Título, descrição e tempo em Chronos são obrigatórios.");
            return;
        }

        // Imagem: usa a nova se selecionada, senão mantém a original
        let serviceImageBase64 = null;
        const file = imageInput?.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise(resolve => reader.onload = resolve);
            serviceImageBase64 = reader.result;
        } else {
            serviceImageBase64 = originalImageBase64 ? `data:image/png;base64,${originalImageBase64}` : null;
        }

        // Categorias
        const tags = document.querySelectorAll("#category-tag-list .tag");
        const categories = Array.from(tags).map(t => ({ name: t.textContent.replace("×", "").trim() }));

        const payload = { title, description, timeChronos, deadline, modality, categoryEntities: categories, serviceImage: serviceImageBase64 };

        try {
            const res = await fetch(`/service/put/${serviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Pedido atualizado com sucesso!");
                window.location.href = `/view_service?id=${serviceId}`;
            } else {
                const err = await res.json();
                alert(`Erro: ${err.error || "Não foi possível salvar."}`);
            }
        } catch (err) {
            console.error(err);
            alert("Falha na comunicação com o servidor.");
        }
    });
});
