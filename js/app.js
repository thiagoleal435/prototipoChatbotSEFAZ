/* --- ESTADO GLOBAL --- */
const appState = {
    currentUser: null,
    currentTab: 'agent',
    activeChatId: null,
    queue: [
        { id: 1, name: 'Maria Silva', cpf: '***.452.884-**', channel: 'WhatsApp', status: 'new', history: ['[Bot] Menu', '[User] IPVA', '[Bot] Placa?', '[User] Erro'] },
        { id: 2, name: 'João Transportes', cpf: '***.112.333-**', channel: 'Telegram', status: 'wait', history: ['[Bot] Olá', '[User] NFA-e'] }
    ],
    kb: [
        { id: 1, title: 'Calendário IPVA 2025', category: 'IPVA', status: 'Ativo' },
        { id: 2, title: 'Emitir NFA-e', category: 'Fiscal', status: 'Ativo' }
    ]
};

/* --- INICIALIZAÇÃO --- */
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('simulate-citizen-btn').addEventListener('click', openCitizenApp);
    
    // Citizen App
    document.getElementById('accept-lgpd-btn').addEventListener('click', acceptLGPD);
    document.getElementById('citizen-send').addEventListener('click', handleCitizenSend);
    
    // Configura botões de resposta rápida (chips)
    document.querySelectorAll('.quick-replies .chip').forEach(chip => {
        chip.addEventListener('click', (e) => handleCitizenSend(null, e.target.dataset.msg));
    });
    
    // Navegação do Sistema Interno
    document.querySelectorAll('.menu-item[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => switchTab(e.currentTarget.dataset.tab));
    });
    document.getElementById('logout-btn').addEventListener('click', () => location.reload());
    
    // Chat do Atendente
    document.getElementById('agent-send').addEventListener('click', handleAgentSend);
    document.getElementById('end-chat-btn').addEventListener('click', endChat);

    // Pesquisa de Satisfação
    document.querySelectorAll('.star-rate').forEach(star => {
        star.addEventListener('click', (e) => {
            const val = e.target.dataset.value;
            document.querySelectorAll('.star-rate').forEach(s => s.classList.remove('active'));
            for(let i=0; i<val; i++) document.querySelectorAll('.star-rate')[i].classList.add('active');
        });
    });
    document.getElementById('send-survey-btn').addEventListener('click', submitSurvey);
}

/* --- FUNÇÕES DE NAVEGAÇÃO E UI --- */
function showScreen(screenId) {
    // Remove classe 'active' de todas as telas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Adiciona classe 'active' apenas na tela desejada
    const screen = document.getElementById(screenId);
    if(screen) screen.classList.add('active');
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* --- LÓGICA DE LOGIN (RF09) --- */
function handleLogin(e) {
    e.preventDefault();
    const userInput = document.getElementById('username').value;
    const user = userInput ? userInput.toLowerCase() : '';
    
    if (user === 'admin' || user === 'agent') {
        // Define perfil
        appState.currentUser = { 
            name: user === 'admin' ? 'Administrador' : 'João Atendente', 
            role: user === 'admin' ? 'Gestor' : 'Atendente' 
        };
        
        // Atualiza UI com nome do usuário
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        if(nameEl) nameEl.innerText = appState.currentUser.name;
        if(roleEl) roleEl.innerText = appState.currentUser.role;
        
        // CORREÇÃO: Comandos que faltavam para trocar a tela
        showScreen('internal-system'); 
        renderQueue();
        renderKB();
        if(user === 'admin') renderCharts();
    } else {
        alert('Usuário inválido. Tente "admin" ou "agent".');
    }
}

/* --- LÓGICA DO CIDADÃO (APP) --- */
function openCitizenApp(e) {
    e.preventDefault();
    showScreen('citizen-screen');
    // Mostra LGPD Check (RNF01) após pequeno delay
    setTimeout(() => {
        const modal = document.getElementById('lgpd-modal');
        if(modal) modal.classList.add('active');
    }, 500);
}

function acceptLGPD() {
    document.getElementById('lgpd-modal').classList.remove('active');
    appendMsg('citizen-chat-feed', 'received', 'Olá! Sou a assistente virtual da SEFAZ-PE. Como posso ajudar?');
}

function handleCitizenSend(e, textOverride) {
    const input = document.getElementById('citizen-input');
    const text = textOverride || input.value;
    if (!text) return;
    
    appendMsg('citizen-chat-feed', 'sent', text);
    input.value = '';

    // Simulação Bot Inteligente (RF02 & RF03)
    setTimeout(() => {
        let response = "Desculpe, não entendi. Tente usar os botões abaixo.";
        const lowerText = text.toLowerCase();

        // CORREÇÃO: Lógica para Situação Fiscal adicionada
        if (lowerText.includes('ipva')) {
            response = "Para consultar o IPVA, acesse nosso portal ou informe a PLACA do veículo.";
        } 
        else if (lowerText.includes('fiscal') || lowerText.includes('situação')) {
            response = "Para verificar sua Situação Fiscal, acesse o e-Fisco com seu certificado digital ou informe o CPF.";
        }
        else if (lowerText.includes('humano') || lowerText.includes('atendente')) {
            response = "Transferindo você para um de nossos especialistas... Por favor aguarde.";
            // Adicionar à fila do atendente
            addToQueue('Cidadão Web', '***.000.000-**', 'WebChat');
        }
        
        appendMsg('citizen-chat-feed', 'received', response);
    }, 1000);
}

function appendMsg(elementId, type, text) {
    const feed = document.getElementById(elementId);
    const msgDiv = document.createElement('div');
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    msgDiv.className = `msg ${type}`;
    msgDiv.innerHTML = `${text} <span class="msg-time">${time}</span>`;
    feed.appendChild(msgDiv);
    feed.scrollTop = feed.scrollHeight;
}

/* --- LÓGICA DO ATENDENTE (RF04, RF06) --- */
function switchTab(tabId) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    const activeMenu = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
    if(activeMenu) activeMenu.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${tabId}`);
    if(activeTab) activeTab.classList.add('active');
}

function renderQueue() {
    const list = document.getElementById('queue-list');
    if(!list) return;
    
    list.innerHTML = '';
    const countEl = document.getElementById('queue-count');
    if(countEl) countEl.innerText = appState.queue.length;

    appState.queue.forEach(item => {
        const div = document.createElement('div');
        div.className = `queue-item ${appState.activeChatId === item.id ? 'active' : ''}`;
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:bold">
                ${item.name} <span style="font-size:0.7rem; color:#888">${item.channel}</span>
            </div>
            <div style="font-size:0.8rem; color:#666">Aguardando atendimento...</div>
        `;
        div.onclick = () => loadChat(item);
        list.appendChild(div);
    });
}

function addToQueue(name, cpf, channel) {
    const newItem = { id: Date.now(), name, cpf, channel, status: 'new', history: ['[Bot] Início', '[User] Solicitação Humana'] };
    appState.queue.push(newItem);
    if(appState.currentUser) {
        renderQueue();
        showToast(`Novo chamado na fila: ${name}`);
    }
}

function loadChat(item) {
    appState.activeChatId = item.id;
    renderQueue(); // Atualiza visual active
    
    // Atualiza Contexto
    const dataEl = document.getElementById('citizen-data');
    if(dataEl) {
        dataEl.innerHTML = `
            <p><b>Nome:</b> ${item.name}</p>
            <p><b>CPF:</b> ${item.cpf}</p>
            <p><b>Canal:</b> ${item.channel}</p>
        `;
    }
    
    // Histórico (RF06)
    const historyDiv = document.getElementById('bot-history-log');
    if(historyDiv) historyDiv.innerHTML = item.history.join('<br>');

    // Area Chat
    const chatFeed = document.getElementById('agent-chat-feed');
    if(chatFeed) {
        chatFeed.innerHTML = '';
        appendMsg('agent-chat-feed', 'received', `Sistema: Você assumiu o atendimento de ${item.name}.`);
    }
    
    const endBtn = document.getElementById('end-chat-btn');
    if(endBtn) endBtn.disabled = false;
}

function handleAgentSend() {
    const input = document.getElementById('agent-input');
    if(!input || !input.value || !appState.activeChatId) return;
    appendMsg('agent-chat-feed', 'sent', input.value);
    input.value = '';
}

function endChat() {
    if(!confirm('Deseja encerrar e arquivar este atendimento?')) return;
    appState.queue = appState.queue.filter(i => i.id !== appState.activeChatId);
    appState.activeChatId = null;
    renderQueue();
    
    const chatFeed = document.getElementById('agent-chat-feed');
    if(chatFeed) chatFeed.innerHTML = '<div class="empty-state">Selecione um atendimento</div>';
    
    const dataEl = document.getElementById('citizen-data');
    if(dataEl) dataEl.innerHTML = '<p class="text-muted">Nenhum selecionado</p>';
    
    const endBtn = document.getElementById('end-chat-btn');
    if(endBtn) endBtn.disabled = true;
    
    showToast('Atendimento encerrado com sucesso. (RF06)');
}

/* --- DASHBOARD & KB (RF07, RF05) --- */
function renderCharts() {
    const chartVol = document.getElementById('chart-volume');
    const chartRet = document.getElementById('chart-retention');
    
    // Verifica se os elementos canvas existem antes de criar os gráficos
    if (chartVol && typeof Chart !== 'undefined') {
        // Destruir gráfico anterior se existir (opcional para protótipo simples)
        new Chart(chartVol, {
            type: 'bar',
            data: {
                labels: ['WhatsApp', 'Telegram', 'Web'],
                datasets: [{ label: 'Atendimentos', data: [850, 200, 150], backgroundColor: '#003366' }]
            }
        });
    }
    
    if (chartRet && typeof Chart !== 'undefined') {
        new Chart(chartRet, {
            type: 'doughnut',
            data: {
                labels: ['IA', 'Humano'],
                datasets: [{ data: [72, 28], backgroundColor: ['#003366', '#ffc107'] }]
            }
        });
    }
}

function renderKB() {
    const tbody = document.getElementById('kb-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    appState.kb.forEach(row => {
        tbody.innerHTML += `
            <tr>
                <td>${row.id}</td>
                <td>${row.title}</td>
                <td><span class="badge" style="background:#28a745">${row.category}</span></td>
                <td>${row.status}</td>
                <td><button class="btn btn-primary" style="padding:2px 8px"><i class="fas fa-edit"></i></button></td>
            </tr>
        `;
    });
}

/* --- SURVEY (RF08) --- */
function submitSurvey() {
    const modal = document.getElementById('survey-modal');
    if(modal) modal.classList.remove('active');
    showToast('Avaliação enviada! Obrigado.');
    setTimeout(() => location.reload(), 2000);
}