// BuyChronos.js
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("auth_token");
    if (!token) { window.location.href = "/"; return; }

    // Carregar saldo atual
    async function loadBalance() {
        try {
            const res = await fetch("/user/get", { headers: { "Authorization": "Bearer " + token } });
            if (res.ok) {
                const user = await res.json();
                document.querySelectorAll(".qty-chronos-text").forEach(el => el.textContent = user.timeChronos ?? 0);
                localStorage.setItem("user_chronos", user.timeChronos ?? 0);
                const amountInput = document.getElementById("input-chronos-amount");
                if (amountInput) amountInput.max = Math.max(0, 300 - (user.timeChronos || 0));
            }
        } catch (e) { console.error(e); }
    }
    loadBalance();

    // Cálculo em tempo real
    const amountInput = document.getElementById("input-chronos-amount");
    function updateCalc() {
        const amount = parseInt(amountInput.value) || 0;
        const subtotal = amount * 2.50;
        const tax = subtotal * 0.10;
        const total = subtotal + tax;
        document.getElementById("calc-subtotal").textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById("calc-tax").textContent = `R$ ${tax.toFixed(2).replace('.', ',')}`;
        document.getElementById("calc-total").textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
    if (amountInput) amountInput.addEventListener("input", updateCalc);

    // Envio
    document.getElementById("buy-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        const amount = parseInt(amountInput.value);
        const errorEl = document.getElementById("amount-error");

        if (!amount || amount <= 0) {
            errorEl.classList.add("show");
            return;
        }
        errorEl.classList.remove("show");

        try {
            const res = await fetch("/user/put/buy-chronos", {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token, "Chronos": String(amount) }
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("last_transaction", JSON.stringify({ type: "buy", ...data }));
                window.location.href = "/buy_success";
            } else {
                alert(`Erro: ${data.error || "Não foi possível concluir a compra."}`);
            }
        } catch (err) {
            console.error(err);
            alert("Falha na comunicação com o servidor.");
        }
    });
});
