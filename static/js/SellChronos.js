// SellChronos.js
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("auth_token");
    if (!token) { window.location.href = "/"; return; }

    let currentBalance = 0;

    async function loadBalance() {
        try {
            const res = await fetch("/user/get", { headers: { "Authorization": "Bearer " + token } });
            if (res.ok) {
                const user = await res.json();
                currentBalance = user.timeChronos || 0;
                document.querySelectorAll(".qty-chronos-text").forEach(el => el.textContent = currentBalance);
                const saldoEl = document.getElementById("saldo-disponivel");
                if (saldoEl) saldoEl.textContent = currentBalance;
                const amountInput = document.getElementById("input-chronos-amount");
                if (amountInput) amountInput.max = Math.max(0, currentBalance - 1);
                localStorage.setItem("user_chronos", currentBalance);
            }
        } catch (e) { console.error(e); }
    }
    loadBalance();

    const amountInput = document.getElementById("input-chronos-amount");
    function updateCalc() {
        const amount = parseInt(amountInput.value) || 0;
        const gross = amount * 2.00;
        const tax = gross * 0.10;
        const net = gross - tax;
        document.getElementById("calc-gross").textContent = `R$ ${gross.toFixed(2).replace('.', ',')}`;
        document.getElementById("calc-tax").textContent = `- R$ ${tax.toFixed(2).replace('.', ',')}`;
        document.getElementById("calc-net").textContent = `R$ ${net.toFixed(2).replace('.', ',')}`;
    }
    if (amountInput) amountInput.addEventListener("input", updateCalc);

    document.getElementById("sell-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        const amount = parseInt(amountInput.value);
        const pixKey = document.getElementById("input-pix-key").value.trim();
        const amountErr = document.getElementById("amount-error");
        const pixErr = document.getElementById("pix-error");

        let valid = true;
        if (!amount || amount <= 0 || (currentBalance - amount) < 1) {
            amountErr.classList.add("show");
            valid = false;
        } else { amountErr.classList.remove("show"); }

        if (!pixKey) {
            pixErr.classList.add("show");
            valid = false;
        } else { pixErr.classList.remove("show"); }

        if (!valid) return;

        try {
            const res = await fetch("/user/put/sell-chronos", {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token, "Chronos": String(amount) }
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("last_transaction", JSON.stringify({ type: "sell", pixKey, ...data }));
                window.location.href = "/sell_success";
            } else {
                alert(`Erro: ${data.error || "Não foi possível concluir a venda."}`);
            }
        } catch (err) {
            console.error(err);
            alert("Falha na comunicação com o servidor.");
        }
    });
});
