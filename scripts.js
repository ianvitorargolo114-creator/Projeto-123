/**
 * Classe que representa a entidade de um Gasto (Model)
 */
class Expense {
    /**
     * @param {string} description - Descrição do gasto
     * @param {number} amount - Valor do gasto
     * @param {string} category - Categoria selecionada
     * @param {string} date - Data no formato AAAA-MM-DD
     * @param {number} [id] - ID opcional (usa timestamp se não fornecido)
     */
    constructor(description, amount, category, date, id = Date.now()) {
        this.id = id;
        this.descricao = description;
        this.valor = amount;
        this.categoria = category;
        this.data = date;
    }
}

/**
 * Classe responsável pelo gerenciamento do sistema e da interface (Controller/Service)
 */
class ExpenseManager {
    constructor() {
        // Inicializa o estado carregando dados do LocalStorage (RF07)
        this.expenses = this._loadExpenses();
        this.monthlyLimit = this._loadLimit();

        // Faz o mapeamento dos elementos do DOM
        this._initDOM();
        
        // Vincula os eventos de escuta (Event Listeners)
        this._bindEvents();

        // Renderiza o estado inicial do sistema
        this.updateSystem();
    }

    /**
     * Mapeia os elementos do HTML necessários para a manipulação
     */
    _initDOM() {
        this.expenseForm = document.getElementById('expense-form');
        this.descInput = document.getElementById('desc');
        this.amountInput = document.getElementById('amount');
        this.categorySelect = document.getElementById('category');
        this.dateInput = document.getElementById('date');

        this.limitInput = document.getElementById('input-limit');
        this.metricTotal = document.getElementById('metric-total');
        this.metricAvailable = document.getElementById('metric-available');
        this.limitAlert = document.getElementById('limit-alert');
        this.expenseListContainer = document.getElementById('expense-list-container');

        // Define a data atual como padrão no formulário
        this.dateInput.value = new Date().toISOString().split('T')[0];
        this.limitInput.value = this.monthlyLimit.toFixed(2);
    }

    /**
     * Registra as funções de callback para os eventos do usuário
     */
    _bindEvents() {
        // O uso de .bind(this) garante que o escopo 'this' dentro dos métodos aponte para a instância da classe
        this.expenseForm.addEventListener('submit', this._handleFormSubmit.bind(this));
        this.limitInput.addEventListener('input', this._handleLimitChange.bind(this));
    }

    /**
     * Carrega os gastos armazenados no navegador
     */
    _loadExpenses() {
        const stored = localStorage.getItem('expenses');
        if (!stored) return [];
        
        // Transforma o JSON bruto de volta em instâncias reais da classe Expense
        const rawData = JSON.parse(stored);
        return rawData.map(item => new Expense(item.descricao, item.valor, item.categoria, item.data, item.id));
    }

    /**
     * Carrega o limite definido pelo usuário
     */
    _loadLimit() {
        return parseFloat(localStorage.getItem('monthlyLimit')) || 1000.00;
    }

    /**
     * Salva a lista atual de gastos no LocalStorage
     */
    _saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    /**
     * Gerencia a alteração dinâmica do limite mensal
     */
    _handleLimitChange(e) {
        const val = parseFloat(e.target.value);
        this.monthlyLimit = isNaN(val) || val < 0 ? 0 : val;
        localStorage.setItem('monthlyLimit', this.monthlyLimit);
        this.updateSystem(); // RN05 - Atualização automática
    }

    /**
     * Gerencia a validação e submissão do formulário de novos gastos
     */
    _handleFormSubmit(e) {
        e.preventDefault();

        const desc = this.descInput.value.trim();
        const amount = parseFloat(this.amountInput.value);
        const category = this.categorySelect.value;
        const date = this.dateInput.value;

        // Validações do sistema (Seção 10)
        if (!desc) return alert("❌ A descrição deve ser preenchida.");
        if (isNaN(amount)) return alert("❌ Informe um valor numérico válido.");
        if (amount <= 0) return alert("❌ Informe um valor maior que R$ 0,00.");
        if (!category) return alert("❌ Selecione uma categoria.");
        if (!date) return alert("❌ A data deve ser informada.");

        // Cria uma nova instância do objeto Expense via POO
        const newExpense = new Expense(desc, amount, category, date);

        // Adiciona à lista de gerenciamento
        this.expenses.push(newExpense);
        this._saveExpenses();
        this.updateSystem(); // RN05 - Atualização automática
        this._resetForm();
    }

    /**
     * Remove um gasto pelo seu ID único
     * @param {number} id 
     */
    deleteExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this._saveExpenses();
        this.updateSystem(); // RN05 - Atualização automática
    }

    /**
     * Reseta os campos de preenchimento do formulário
     */
    _resetForm() {
        this.descInput.value = '';
        this.amountInput.value = '';
        this.categorySelect.value = '';
        this.dateInput.value = new Date().toISOString().split('T')[0];
    }

    /**
     * Métodos utilitários de formatação de valores na tela
     */
    _formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    _formatDate(dateString) {
        const parts = dateString.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    /**
     * Renderiza o histórico de gastos com base na ordenação solicitada (RF02)
     */
    _renderExpenses() {
        this.expenseListContainer.innerHTML = '';

        if (this.expenses.length === 0) {
            this.expenseListContainer.innerHTML = '<li class="empty-state">Nenhum gasto cadastrado.</li>';
            return;
        }

        // Clona a lista e ordena: itens mais recentes aparecem primeiro
        const sortedExpenses = [...this.expenses].sort((a, b) => {
            const dateA = new Date(a.data);
            const dateB = new Date(b.data);
            if (dateB - dateA !== 0) return dateB - dateA;
            return b.id - a.id;
        });

        sortedExpenses.forEach(expense => {
            const li = document.createElement('li');
            li.className = 'expense-item';
            
            li.innerHTML = `
                <div class="expense-info">
                    <span class="expense-title">${expense.descricao}</span>
                    <div class="expense-meta">
                        <span class="expense-tag">${expense.categoria}</span>
                        <span>• ${this._formatDate(expense.data)}</span>
                    </div>
                </div>
                <div class="right-side">
                    <span class="expense-amount">${this._formatCurrency(expense.valor)}</span>
                    <button class="btn btn-danger" data-id="${expense.id}">Excluir</button>
                </div>
            `;

            // Adiciona evento de clique individual para exclusão mapeando o botão
            li.querySelector('.btn-danger').addEventListener('click', () => {
                this.deleteExpense(expense.id);
            });

            this.expenseListContainer.appendChild(li);
        });
    }

    /**
     * Central de processamento de cálculos matemáticas e alertas visuais (RF04, RF05, RN05, RN06)
     */
    updateSystem() {
        // 1. Calcula a soma total dos gastos cadastrados (RF04)
        const totalGasto = this.expenses.reduce((sum, item) => sum + item.valor, 0);
        
        // 2. Calcula o saldo restante baseado no limite estabelecido (RF05)
        const saldoDisponivel = this.monthlyLimit - totalGasto;

        // Atualiza os componentes do painel métrico
        this.metricTotal.textContent = this._formatCurrency(totalGasto);
        this.metricAvailable.textContent = this._formatCurrency(saldoDisponivel);

        // Altera a cor do texto do painel dinamicamente
        this.metricAvailable.style.color = saldoDisponivel < 0 ? 'var(--danger)' : 'var(--success)';

        // 3. Verifica se a regra de negócio de teto de gastos foi ferida (RN06)
        if (totalGasto > this.monthlyLimit) {
            const ultrapassouVal = totalGasto - this.monthlyLimit;
            this.limitAlert.innerHTML = `⚠️ Você ultrapassou seu limite mensal em ${this._formatCurrency(ultrapassouVal)}.`;
            this.limitAlert.style.display = 'block';
        } else {
            this.limitAlert.style.display = 'none';
        }

        // Atualiza a visualização final do histórico de elementos na tela
        this._renderExpenses();
    }
}

// Inicializa a aplicação criando o objeto gerenciador central
const app = new ExpenseManager();
