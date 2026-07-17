let currentStep = 1;
const totalSteps = 4;

// Field definitions for each step (required fields marked)
const stepFields = {
    1: [
        { id: 'nomeCompleto', required: true, label: 'Nome Completo' },
        { id: 'cpf', required: true, label: 'CPF' }
    ],
    2: [
        { id: 'banco', required: true, label: 'Banco' },
        { id: 'numeroBanco', required: false, label: 'Nº do Banco' },
        { id: 'agencia', required: true, label: 'Agência' },
        { id: 'digitoAgencia', required: false, label: 'Dígito da Agência' },
        { id: 'conta', required: true, label: 'Conta' },
        { id: 'digitoConta', required: true, label: 'Dígito da Conta' },
        { id: 'tipoConta', required: true, label: 'Tipo de Conta' }
    ],
    3: [
        { id: 'tipoChavePix', required: false, label: 'Tipo de Chave Pix' },
        { id: 'chavePix', required: false, label: 'Chave Pix' },
        { id: 'titularConta', required: true, label: 'Titular da Conta' },
        { id: 'cpfTitular', required: false, label: 'CPF do Titular' },
        { id: 'observacoes', required: false, label: 'Observações' }
    ]
};

// CPF mask
function applyCPFMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    
    input.value = value;
}

// Apply masks on input
document.getElementById('cpf').addEventListener('input', function() {
    applyCPFMask(this);
});

document.getElementById('cpfTitular').addEventListener('input', function() {
    applyCPFMask(this);
});

// Validate step
function validateStep(step) {
    const fields = stepFields[step];
    let isValid = true;

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const errorEl = input.parentElement.querySelector('.error-message');
        
        if (field.required && !input.value.trim()) {
            input.classList.add('error');
            if (errorEl) {
                errorEl.classList.add('visible');
            } else {
                const msg = document.createElement('div');
                msg.className = 'error-message visible';
                msg.textContent = 'Este campo é obrigatório';
                input.parentElement.appendChild(msg);
            }
            isValid = false;
        } else {
            input.classList.remove('error');
            if (errorEl) errorEl.classList.remove('visible');
        }
    });

    // CPF validation (basic format check)
    if (step === 1) {
        const cpfInput = document.getElementById('cpf');
        const cpfValue = cpfInput.value.replace(/\D/g, '');
        if (cpfValue.length !== 11) {
            cpfInput.classList.add('error');
            let errorEl = cpfInput.parentElement.querySelector('.error-message');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'error-message visible';
                cpfInput.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = 'CPF deve ter 11 dígitos';
            errorEl.classList.add('visible');
            isValid = false;
        }
    }

    return isValid;
}

// Navigate to next step
function nextStep(step) {
    if (!validateStep(step)) return;

    if (step < totalSteps) {
        showStep(step + 1);
    }

    // If going to review step, populate review data
    if (step === 3) {
        populateReview();
    }
}

// Navigate to previous step
function prevStep(step) {
    if (step > 1) {
        showStep(step - 1);
    }
}

// Go to specific step (for edit buttons)
function goToStep(step) {
    showStep(step);
}

// Show specific step
function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });

    // Show target step
    document.getElementById(`step-${step}`).classList.add('active');

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        el.classList.remove('active', 'completed');
        
        if (stepNum === step) {
            el.classList.add('active');
        } else if (stepNum < step) {
            el.classList.add('completed');
        }
    });

    currentStep = step;

    // Scroll to top of container
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Populate review section
function populateReview() {
    const allFields = [...stepFields[1], ...stepFields[2], ...stepFields[3]];
    
    allFields.forEach(field => {
        const input = document.getElementById(field.id);
        const reviewEl = document.getElementById(`review-${field.id}`);
        if (reviewEl) {
            const value = input.value.trim();
            reviewEl.textContent = value || '—';
        }
    });
}

// Submit form
function submitForm() {
    // Collect all data
    const formData = {};
    const allFields = [...stepFields[1], ...stepFields[2], ...stepFields[3]];
    
    allFields.forEach(field => {
        const input = document.getElementById(field.id);
        formData[field.id] = input.value.trim();
    });

    // Map field IDs to spreadsheet column names
    const spreadsheetData = {
        'Nome Completo': formData.nomeCompleto,
        'CPF': formData.cpf,
        'Banco': formData.banco,
        'Nº do Banco': formData.numeroBanco,
        'Agência': formData.agencia,
        'Dígito da Agência': formData.digitoAgencia,
        'Conta': formData.conta,
        'Dígito da Conta': formData.digitoConta,
        'Tipo de Conta': formData.tipoConta,
        'Chave Pix': formData.chavePix,
        'Tipo de Chave Pix': formData.tipoChavePix,
        'Titular da Conta': formData.titularConta,
        'CPF do Titular (se diferente)': formData.cpfTitular,
        'Observações': formData.observacoes
    };

    // Disable submit button and show loading
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Send data to Google Sheets via Apps Script using form submission
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCEOhfSdkRnlZkTw_bgIcT-kmBkkdsUt-B1jr22muhMkCuhrkbGmaMxKHc8u8xvKR8/exec';

    // Create a hidden form and submit via iframe (most reliable for Google Apps Script)
    const iframe = document.createElement('iframe');
    iframe.name = 'hidden-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = GOOGLE_SCRIPT_URL;
    form.target = 'hidden-iframe';

    // Add all fields to the form
    for (const [key, value] of Object.entries(spreadsheetData)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value || '';
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();

    // Clean up and show success after a brief delay
    setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        showSuccess();
    }, 1500);
}

function showSuccess() {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById('step-success').style.display = 'block';
    document.getElementById('step-success').classList.add('active');

    // Update progress bar - all completed
    document.querySelectorAll('.progress-step').forEach(el => {
        el.classList.remove('active');
        el.classList.add('completed');
    });

    // Reset submit button
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Concluir Cadastro';
}

// Reset form for new entry
function resetForm() {
    // Clear all inputs
    const allFields = [...stepFields[1], ...stepFields[2], ...stepFields[3]];
    allFields.forEach(field => {
        const input = document.getElementById(field.id);
        input.value = '';
        input.classList.remove('error');
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) errorEl.classList.remove('visible');
    });

    // Reset to step 1
    document.getElementById('step-success').style.display = 'none';
    document.getElementById('step-success').classList.remove('active');
    showStep(1);
}
