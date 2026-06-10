const API_URL = 'http://192.168.1.86:9987/api/v1/getCampanhas';

const app = document.getElementById('app');

function createHeader() {
    const header = document.createElement('header');
    header.className = 'app-header';
    
    const title = document.createElement('div');
    title.textContent = 'Campanhas';
    
    const controls = document.createElement('div');
    controls.className = 'app-header-controls';
    
    const minIcon = document.createElement('i');
    minIcon.className = 'ph ph-minus';
    
    const maxIcon = document.createElement('i');
    maxIcon.className = 'ph ph-app-window';
    
    const closeIcon = document.createElement('i');
    closeIcon.className = 'ph ph-x';
    
    controls.appendChild(minIcon);
    controls.appendChild(maxIcon);
    controls.appendChild(closeIcon);
    
    header.appendChild(title);
    header.appendChild(controls);
    
    return header;
}

function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    
    const buttons = [
        { icon: 'ph-list-checks', label: 'Livres' },
        { icon: 'ph-check-square', label: 'Fechadas' },
        { icon: 'ph-x-circle', label: 'Cancelar' },
        { icon: 'ph-file-plus', label: 'Nova' },
        { icon: 'ph-calendar-check', label: 'Reservas' },
        { icon: 'ph-warning-circle', label: 'Faltas' },
        { icon: 'ph-package', label: 'Estoque' },
        { icon: 'ph-printer', label: 'Imprimir' },
        { icon: 'ph-megaphone', label: 'Prioridade' },
        { icon: 'ph-warehouse', label: 'Depósito' },
        { icon: 'ph-wrench', label: 'Recurso' },
        { icon: 'ph-tag', label: 'Etiqueta' }
    ];
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'toolbar-btn';
        
        const icon = document.createElement('i');
        icon.className = `ph ${btn.icon}`;
        
        const span = document.createElement('span');
        span.textContent = btn.label;
        
        button.appendChild(icon);
        button.appendChild(span);
        toolbar.appendChild(button);
    });
    
    return toolbar;
}

function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    
    const btnCancelar = document.createElement('button');
    btnCancelar.className = 'btn-primary';
    btnCancelar.innerHTML = `<i class="ph ph-x"></i> Cancelar`;
    
    const btnAtualizar = document.createElement('button');
    btnAtualizar.className = 'btn-primary';
    btnAtualizar.innerHTML = `<i class="ph ph-arrows-clockwise"></i> Atualizar`;
    btnAtualizar.onclick = () => loadData();
    
    const btnFiltrar = document.createElement('button');
    btnFiltrar.className = 'btn-primary';
    btnFiltrar.innerHTML = `<i class="ph ph-funnel"></i> Filtrar recurso`;
    
    footer.appendChild(btnCancelar);
    footer.appendChild(btnAtualizar);
    footer.appendChild(btnFiltrar);
    
    return footer;
}

function getProp(obj, keys) {
    for (let key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return '';
}

function createGrid(data) {
    const container = document.createElement('div');
    container.className = 'grid-container';
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const columns = [
        'Campanha', 'Materia Prima', 'Descricao', 'Recurso', 'Filial', 'Criado por', 'Data de criacao'
    ];
    
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    if (data && data.length > 0) {
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            const fields = [
                getProp(row, ['Campanha', 'campanha', 'ID', 'id']),
                getProp(row, ['Materia Prima', 'Materia_Prima', 'materiaPrima', 'materia_prima', 'MateriaPrima']),
                getProp(row, ['Descricao', 'descricao', 'Descrição', 'descrição']),
                getProp(row, ['Recurso', 'recurso']),
                getProp(row, ['Filial', 'filial']),
                getProp(row, ['Criado por', 'criado_por', 'Criado_por', 'criadoPor', 'CriadoPor', 'usuario']),
                getProp(row, ['Data de criacao', 'data_criacao', 'Data_de_criacao', 'dataCriacao', 'DataCriacao', 'data'])
            ];
            
            fields.forEach(fieldValue => {
                const td = document.createElement('td');
                td.textContent = fieldValue;
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = columns.length;
        td.style.textAlign = 'center';
        td.style.padding = '32px';
        td.style.color = 'var(--text-muted)';
        td.textContent = 'Nenhuma campanha encontrada.';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    return container;
}

function showLoading() {
    return `
        <div class="state-container">
            <i class="ph ph-spinner-gap"></i>
            <h3>Carregando Campanhas</h3>
            <p>Por favor, aguarde...</p>
        </div>
    `;
}

function showError(msg) {
    return `
        <div class="state-container error">
            <i class="ph ph-warning-circle"></i>
            <h3>Erro ao carregar dados</h3>
            <p>${msg}</p>
        </div>
    `;
}

async function loadData() {
    // Clear grid area if it exists, show loading
    const existingGrid = app.querySelector('.grid-container');
    const existingState = app.querySelector('.state-container');
    
    if (existingGrid) existingGrid.remove();
    if (existingState) existingState.remove();
    
    const stateWrapper = document.createElement('div');
    stateWrapper.className = 'grid-container'; // Reuse container to fill space
    stateWrapper.innerHTML = showLoading();
    
    // Insert before footer
    const footer = app.querySelector('.app-footer');
    app.insertBefore(stateWrapper, footer);
    
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        
        // Handle if response is wrapper object vs array directly
        const data = Array.isArray(responseData) ? responseData : (responseData.data || responseData.campanhas || []);
        
        stateWrapper.remove();
        
        const grid = createGrid(data);
        app.insertBefore(grid, footer);
    } catch (error) {
        console.error('Fetch error:', error);
        stateWrapper.innerHTML = showError(error.message);
    }
}

function init() {
    app.innerHTML = ''; // Clear just in case
    
    app.appendChild(createHeader());
    app.appendChild(createToolbar());
    app.appendChild(createFooter());
    
    loadData();
}

// Start app
document.addEventListener('DOMContentLoaded', init);
