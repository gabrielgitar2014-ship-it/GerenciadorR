import { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { supabase } from "../../supabaseClient";
import NewFixedExpenseModal from "../modals/NewFixedExpenseModal";
import TransactionDetailModal from "../modals/TransactionDetailModal";

export default function FixasTab({ selectedMonth }) {
  const { transactions, fetchData } = useData();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [detailModalTransaction, setDetailModalTransaction] = useState(null);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.date && t.date.startsWith(selectedMonth) && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedMonth]);

  const handleSave = async (expenseData) => {
    if (expenseData.id) {
      const { id, description, amount, date, metodo_pagamento, due_date } = expenseData;
      const { error } = await supabase
        .from('transactions')
        .update({ description, amount, date, metodo_pagamento, due_date })
        .eq('id', id);
      if (error) alert(`Erro ao atualizar despesa: ${error.message}`);
      else alert("Despesa atualizada com sucesso!");
    } else {
      const { description, recurrence, startDate, ...restOfData } = expenseData;
      let totalInstallments = 0;
      if (recurrence.type === 'single') totalInstallments = 1;
      else if (recurrence.type === 'fixed') totalInstallments = recurrence.installments;
      else if (recurrence.type === 'infinite') totalInstallments = 120;
      const newExpensesToInsert = [];
      const [startYear, startMonth] = startDate.split('-').map(Number);
      for (let i = 0; i < totalInstallments; i++) {
        const expenseDate = new Date(startYear, startMonth - 1 + i, 1);
        const year = expenseDate.getFullYear();
        const month = String(expenseDate.getMonth() + 1).padStart(2, "0");
        const day = String(restOfData.dueDate).padStart(2, "0");
        newExpensesToInsert.push({
          description: totalInstallments > 1 ? `${description} (${i + 1}/${totalInstallments})` : description,
          amount: restOfData.amount,
          date: `${year}-${month}-${day}`,
          paid: false,
          is_fixed: true,
          type: 'expense',
          metodo_pagamento: restOfData.bank,
          due_date: restOfData.dueDate,
        });
      }
      const { error } = await supabase.from('transactions').insert(newExpensesToInsert);
      if (error) alert(`Erro ao salvar despesa(s) fixa(s): ${error.message}`);
      else alert(`${totalInstallments} despesa(s) fixa(s) foram criadas com sucesso!`);
    }
    fetchData();
    setIsNewModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleOpenEditModal = (transaction) => {
    if (/\(\d+\/\d+\)/.test(transaction.description)) {
      alert("A edição de despesas recorrentes não é permitida. Por favor, exclua e crie novamente se necessário.");
      return;
    }
    setTransactionToEdit(transaction);
    setDetailModalTransaction(null);
    setIsNewModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setTransactionToEdit(null);
    setIsNewModalOpen(true);
  };
  
  const handleCloseNewModal = () => {
    setIsNewModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta despesa?")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        alert(`Erro ao excluir: ${error.message}`);
      } else {
        fetchData();
        setDetailModalTransaction(null);
      }
    }
  };
  
  const handleTogglePaidStatus = async (expenseId, currentStatus) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('transactions')
      .update({ paid: newStatus })
      .eq('id', expenseId);
    if (error) alert(`Erro ao atualizar o status: ${error.message}`);
    else fetchData();
  };

  const monthlyFixedExpenses = transactions.filter(
    (t) => t.date && t.date.startsWith(selectedMonth) && t.type === "expense" && t.is_fixed
  );
  
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const totalFixedExpenses = monthlyFixedExpenses.reduce(
    (sum, expense) => sum + expense.amount, 0
  );

  const percentage = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0;
  const barWidth = Math.min(percentage, 100);

  return (
    <>
      <NewFixedExpenseModal
        isOpen={isNewModalOpen}
        onClose={handleCloseNewModal}
        onSave={handleSave}
        transactionToEdit={transactionToEdit}
      />
      <TransactionDetailModal
        isOpen={!!detailModalTransaction}
        onClose={() => setDetailModalTransaction(null)}
        transaction={detailModalTransaction}
        onDelete={() => handleDelete(detailModalTransaction.id)}
        onEdit={() => handleOpenEditModal(detailModalTransaction)}
      />

      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700"
          >
            <span className="material-symbols-outlined">add</span>Nova Despesa
            Fixa
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md space-y-2">
            <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600">Total de Despesas Fixas:</span>
                <span className="font-bold text-red-600">{formatCurrency(totalFixedExpenses)}</span>
            </div>
            {totalIncome > 0 && (
                 <div>
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Consumo da Renda</span>
                        <span>{percentage.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-red-500 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>


        <div className="bg-white p-6 rounded-lg shadow-md">
          {monthlyFixedExpenses.length === 0 ? (
            <p className="text-gray-500">Nenhuma despesa fixa registrada para este mês.</p>
          ) : (
            <ul className="space-y-3">
              {monthlyFixedExpenses.map((expense) => (
                <li key={expense.id} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                  <button onClick={() => setDetailModalTransaction(expense)} className="text-left flex-1">
                    <span className={`text-gray-700 ${expense.paid ? "line-through text-gray-400" : ""}`}>{expense.description}</span>
                    <span className="font-semibold text-red-600 block">{formatCurrency(expense.amount)}</span>
                  </button>
                  <button onClick={() => handleTogglePaidStatus(expense.id, expense.paid)} className={`py-1 px-3 text-sm font-semibold text-white rounded-full transition-colors ${expense.paid ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"}`}>{expense.paid ? "Pago" : "Pagar"}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}