import { useData } from '../../context/DataContext'; // O import que você já tinha
import { useState, useMemo } from "react";
import MonthlyExpensesModal from "../modals/MonthlyExpensesModal";
import TransactionDetailModal from "../modals/TransactionDetailModal"; 

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const getFinancialHealth = (income, expense) => {
  if (income === 0)
    return { status: "Indefinido", bgColor: "bg-gray-500", message: "Nenhuma renda registrada para este mês." };
  const percentage = (expense / income) * 100;
  if (percentage <= 65)
    return { status: "Saudável", bgColor: "bg-green-500", message: "Seus gastos estão sob controle. Ótimo trabalho!" };
  if (percentage <= 75)
    return { status: "Cuidado", bgColor: "bg-orange-500", message: "Seus gastos estão aumentando. Fique atento!" };
  if (percentage <= 95)
    return { status: "Ruim", bgColor: "bg-red-500", message: "Gastos elevados. É hora de revisar o orçamento." };
  return { status: "Crítico", bgColor: "bg-black", message: "Alerta! Seus gastos superaram sua renda." };
};

// --- ALTERAÇÃO 1: Removido 'transactions' da lista de props ---
export default function GeneralTab({ selectedMonth, parcelasDoMes }) {
  // --- ALTERAÇÃO 2: 'transactions' agora é "puxado" do contexto ---
  const { transactions } = useData();

  const [modalView, setModalView] = useState("closed");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const financialSummary = useMemo(() => {
    // Agora esta variável 'transactions' vem do useData() e não é mais 'undefined'
    const income = transactions
      .filter((t) => t.date && t.date.startsWith(selectedMonth) && t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expenseFromParcelas = parcelasDoMes.reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const expenseFromFixed = transactions
      .filter((t) => t.date && t.date.startsWith(selectedMonth) && t.type === "expense" && t.is_fixed)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const totalExpense = expenseFromParcelas + expenseFromFixed;
    const balance = income - totalExpense;

    return { income, totalExpense, balance };
  }, [selectedMonth, transactions, parcelasDoMes]);

  const health = getFinancialHealth(financialSummary.income, financialSummary.totalExpense);
  
  const allMonthlyExpenses = useMemo(() => {
    const variableExpenses = parcelasDoMes
        .filter(p => p.despesas)
        .map(p => ({
            id: `p-${p.id}`,
            description: p.despesas.description,
            amount: p.amount,
            date: p.despesas.data_compra,
            is_fixed: false,
        }));

    const fixedExpenses = transactions
        .filter(t => t.date && t.date.startsWith(selectedMonth) && t.type === "expense" && t.is_fixed)
        .map(t => ({ ...t, id: `t-${t.id}` }));

    return [...variableExpenses, ...fixedExpenses];
  }, [selectedMonth, transactions, parcelasDoMes]);


  const handleCloseModals = () => setModalView("closed");
  const handleOpenListModal = () => setModalView("list");

  const handleOpenDetailModal = (transaction) => {
    setSelectedTransaction(transaction);
    setModalView("detail"); 
  };
  
  const handleBackToList = () => {
    setSelectedTransaction(null);
    setModalView("list");
  };

  const handleEditPlaceholder = () => alert("A edição deve ser feita na aba correspondente.");
  const handleDeletePlaceholder = () => alert("A exclusão deve ser feita na aba correspondente.");
  
  return (
    <>
      {modalView === "list" && (
        <MonthlyExpensesModal
          isOpen={true}
          onClose={handleCloseModals}
          transactions={allMonthlyExpenses}
          selectedMonth={selectedMonth}
          onTransactionClick={handleOpenDetailModal}
        />
      )}
      {modalView === "detail" && (
        <TransactionDetailModal
          isOpen={true}
          onClose={handleCloseModals}
          onBack={handleBackToList}
          transaction={selectedTransaction}
          onDelete={handleDeletePlaceholder}
          onEdit={handleEditPlaceholder}
        />
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm">Renda do Mês</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.income)}</p>
            </div>
            <span className="material-symbols-outlined text-green-500 text-4xl">arrow_circle_up</span>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm">Despesas do Mês</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.totalExpense)}</p>
            </div>
            <span className="material-symbols-outlined text-red-500 text-4xl">arrow_circle_down</span>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm">Saldo Final</h3>
              <p className={`text-2xl font-bold ${financialSummary.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatCurrency(financialSummary.balance)}</p>
            </div>
            <span className={`material-symbols-outlined ${financialSummary.balance >= 0 ? "text-blue-500" : "text-red-500"} text-4xl`}>scale</span>
          </div>
        </div>
        <div className={`p-4 rounded-lg shadow text-white ${health.bgColor}`}>
          <h3 className="font-bold text-lg">Saúde Financeira: {health.status}</h3>
          <p className="text-sm">{health.message}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-2">Contas do Mês</h3>
          <p className="text-gray-600 mb-4">Veja um resumo de todas as despesas realizadas neste mês.</p>
          <button
            onClick={handleOpenListModal}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">visibility</span>
            Visualizar Todas as Despesas
          </button>
        </div>
      </div>
    </>
  );
}