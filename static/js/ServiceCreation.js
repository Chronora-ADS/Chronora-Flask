// ServiceCreation.js
document.addEventListener("DOMContentLoaded", function () {
    // --- DESABILITAR AUTOCOMPLETE DE FORMA MAIS EFETIVA ---
    const disableAutocomplete = () => {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('spellcheck', 'false');
        });
    };
    
    disableAutocomplete();
    setTimeout(disableAutocomplete, 100);

    // --- VARIÁVEIS PARA VALIDAÇÃO ---
    const form = document.getElementById('register-form');
    const titleInput = document.getElementById('input-title');
    const descriptionInput = document.getElementById('input-description');
    const timeInput = document.getElementById('input-time-chronos');
    const imageInput = document.getElementById('input-service-image');
    const categoryInput = document.getElementById('input-category');
    const tagList = document.getElementById('category-tag-list');
    const imageButton = document.getElementById('btn-service-image');
    const imageButtonText = imageButton.querySelector('.btn-text');
    const categoryLabel = document.getElementById('label-category');

    // Elementos de símbolo de erro
    const titleErrorSymbol = document.getElementById('title-error');
    const descriptionErrorSymbol = document.getElementById('description-error');
    const timeErrorSymbol = document.getElementById('time-error');
    const categoryErrorSymbol = document.getElementById('category-error');

    // --- FUNÇÕES DE VALIDAÇÃO ---
    function showError(element, symbolElement, message, isCategory = false) {
        // Mostra símbolo de erro
        if (symbolElement) {
            symbolElement.classList.add('show');
        }
        
        // Para campos de texto: adiciona classe error
        if (element === titleInput || element === descriptionInput || 
            element === timeInput || element === categoryInput) {
            
            element.classList.add('error');
        }
        
        // Para botão de imagem: adiciona classe error (texto fica vermelho via CSS)
        if (element === imageButton) {
            imageButton.classList.add('error');
        }
        
        // Para categoria: adiciona classe error ao container E label
        if (isCategory) {
            const categoryContainer = document.querySelector('.category-input-container');
            if (categoryContainer) {
                categoryContainer.classList.add('error');
            }
            if (categoryLabel) {
                categoryLabel.style.color = '#ff4444';
            }
        }
    }

    function hideError(element, symbolElement, isCategory = false) {
        // Esconde símbolo de erro
        if (symbolElement) {
            symbolElement.classList.remove('show');
        }
        
        // Para campos de texto: remove classe error
        if (element === titleInput || element === descriptionInput || 
            element === timeInput || element === categoryInput) {
            
            element.classList.remove('error');
        }
        
        // Para botão de imagem: remove classe error
        if (element === imageButton) {
            imageButton.classList.remove('error');
        }
        
        // Para categoria: remove classe error do container E label
        if (isCategory) {
            const categoryContainer = document.querySelector('.category-input-container');
            if (categoryContainer) {
                categoryContainer.classList.remove('error');
            }
            if (categoryLabel) {
                categoryLabel.style.color = '';
            }
        }
    }

    function validateTitle() {
        const value = titleInput.value.trim();
        if (!value) {
            showError(titleInput, titleErrorSymbol, 'Este campo é obrigatório!');
            return false;
        }
        hideError(titleInput, titleErrorSymbol);
        return true;
    }

    function validateDescription() {
        const value = descriptionInput.value.trim();
        if (!value) {
            showError(descriptionInput, descriptionErrorSymbol, 'Este campo é obrigatório!');
            return false;
        }
        hideError(descriptionInput, descriptionErrorSymbol);
        return true;
    }

    function validateTime() {
        const value = timeInput.value.trim();
        if (!value) {
            showError(timeInput, timeErrorSymbol, 'Este campo é obrigatório!');
            return false;
        }
        
        const time = parseInt(value);
        
        // Valida se é um número
        if (isNaN(time)) {
            showError(timeInput, timeErrorSymbol, 'Digite um número válido!');
            return false;
        }
        
        // Valida se é positivo
        if (time <= 0) {
            showError(timeInput, timeErrorSymbol, 'Digite um número positivo!');
            return false;
        }
        
        // Valida limite máximo de 100
        if (time > 100) {
            showError(timeInput, timeErrorSymbol, 'Máximo permitido: 100 chronos!');
            return false;
        }
        
        hideError(timeInput, timeErrorSymbol);
        return true;
    }

    function validateImage() {
        const file = imageInput.files[0];
        if (!file) {
            showError(imageButton, null, 'Selecione uma imagem!');
            return false;
        }
        
        // Valida tipo de arquivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showError(imageButton, null, 'Formato inválido! Use JPG ou PNG.');
            return false;
        }
        
        // Valida tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError(imageButton, null, 'Imagem muito grande! Máx: 5MB');
            return false;
        }
        
        hideError(imageButton, null);
        return true;
    }

    function validateCategories() {
        const tags = document.querySelectorAll('#category-tag-list .tag');
        if (tags.length === 0) {
            showError(categoryInput, categoryErrorSymbol, 'Adicione uma categoria!', true);
            return false;
        }
        hideError(categoryInput, categoryErrorSymbol, true);
        return true;
    }

    function validateForm() {
        let isValid = true;
        
        if (!validateTitle()) isValid = false;
        if (!validateDescription()) isValid = false;
        if (!validateTime()) isValid = false;
        if (!validateImage()) isValid = false;
        if (!validateCategories()) isValid = false;
        
        return isValid;
    }

    // --- EVENT LISTENERS PARA VALIDAÇÃO EM TEMPO REAL ---
    titleInput.addEventListener('input', function() {
        if (this.value.trim()) {
            hideError(this, titleErrorSymbol);
        }
    });
    
    descriptionInput.addEventListener('input', function() {
        if (this.value.trim()) {
            hideError(this, descriptionErrorSymbol);
        }
    });
    
    timeInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value) {
            const time = parseInt(value);
            if (!isNaN(time) && time > 0 && time <= 100) {
                hideError(this, timeErrorSymbol);
            }
        }
    });
    
    // Previne que o usuário digite valores maiores que 100
    timeInput.addEventListener('change', function() {
        const value = this.value.trim();
        if (value) {
            const time = parseInt(value);
            if (!isNaN(time) && time > 100) {
                this.value = 100;
                validateTime(); // Valida novamente com o valor corrigido
            }
        }
    });
    
    imageInput.addEventListener('change', function() {
        const fileName = this.files[0] ? this.files[0].name : '';
        document.getElementById('service-image-chosen').textContent = fileName;
        
        if (this.files[0]) {
            validateImage();
        }
    });

    // Limpa erro quando começa a digitar nos campos
    titleInput.addEventListener('focus', function() {
        if (this.classList.contains('error')) {
            hideError(this, titleErrorSymbol);
        }
    });
    
    descriptionInput.addEventListener('focus', function() {
        if (this.classList.contains('error')) {
            hideError(this, descriptionErrorSymbol);
        }
    });
    
    timeInput.addEventListener('focus', function() {
        if (this.classList.contains('error')) {
            hideError(this, timeErrorSymbol);
        }
    });

    // --- Manipulação do botão de imagem do serviço ---
    imageButton.addEventListener('click', function () {
        imageInput.click();
    });

    // ----- TAG DE CATEGORIAS -----
    if (categoryInput && tagList) {
        categoryInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && categoryInput.value.trim() !== "") {
                e.preventDefault();
                const category = categoryInput.value.trim();

                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.innerHTML = `
                    ${category}
                    <span class="remove-tag" onclick="removeTag(this)">×</span>
                `;
                tagList.appendChild(tag);

                categoryInput.value = "";
                hideError(categoryInput, categoryErrorSymbol, true);
            }
        });
    }

    // Função global para remover tag
    window.removeTag = function (element) {
        element.parentElement.remove();
        const tags = document.querySelectorAll('#category-tag-list .tag');
        if (tags.length === 0) {
            validateCategories();
        } else {
            hideError(categoryInput, categoryErrorSymbol, true);
        }
    };

    // Limpa erro de categoria quando começa a digitar
    categoryInput.addEventListener('focus', function() {
        hideError(categoryInput, categoryErrorSymbol, true);
    });

    // --- TRUQUE ADICIONAL: Criar campos falsos para confundir o navegador ---
    window.addEventListener('DOMContentLoaded', () => {
        const fakeFields = document.createElement('div');
        fakeFields.style.display = 'none';
        fakeFields.innerHTML = `
            <input type="text" name="username" autocomplete="new-username">
            <input type="password" name="password" autocomplete="new-password">
            <input type="email" name="email" autocomplete="new-email">
            <input type="tel" name="phone" autocomplete="new-tel">
        `;
        form.appendChild(fakeFields);
    });

    // --- Manipulação do envio do formulário ---
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Valida o formulário antes de enviar
        if (!validateForm()) {
            // Rola até o primeiro campo com erro
            const firstError = document.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        // Coleta os dados do formulário
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const timeChronos = parseInt(timeInput.value.trim());
        const file = imageInput.files[0];

        // Obtém o user_id do localStorage
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Você precisa estar logado para criar um serviço.");
            window.location.href = "http://127.0.0.1:5000/";
            return;
        }

        // Converte a imagem para Base64
        let serviceImageBase64 = "";
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise(resolve => reader.onload = resolve);
            serviceImageBase64 = reader.result;
        } catch (err) {
            showError(imageButton, null, "Erro ao carregar imagem!");
            console.error(err);
            return;
        }

        // COLETA AS CATEGORIAS DAS TAGS
        const categoryElements = document.querySelectorAll('#category-tag-list .tag');
        const categories = Array.from(categoryElements).map(tag => {
            const categoryName = tag.textContent.replace('×', '').trim();
            return { name: categoryName };
        });

        // Monta o payload
        const payload = {
            title,
            description,
            timeChronos,
            categoryEntities: categories,
            serviceImage: serviceImageBase64
        };

        console.log("Payload enviado:", payload);

        const token = localStorage.getItem("auth_token");
        if (!token) {
            alert("Token de autenticação não encontrado.");
            window.location.href = "http://127.0.0.1:5000/";
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/service/post/${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Serviço criado com sucesso!");
                window.location.href = "http://127.0.0.1:5000/home";
            } else {
                let errorMessage = "Erro desconhecido ao criar serviço.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    try {
                        errorMessage = await response.text();
                    } catch (textError) {
                        console.error("Erro ao ler resposta:", textError);
                    }
                }
                
                if (response.status === 401 || response.status === 422) {
                    alert("Sessão expirada. Faça login novamente.");
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_id");
                    window.location.href = "http://127.0.0.1:5000/";
                } else {
                    alert(`Erro ${response.status}: ${errorMessage}`);
                }
            }
        } catch (err) {
            alert("Falha na comunicação com o servidor.");
            console.error(err);
        }
    });
});