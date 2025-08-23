import { useState } from "react";
import { useData } from "../../context/DataContext";
import { supabase } from "../../supabaseClient";
import NewIncomeModal from "../modals/NewIncomeModal";
import TransactionDetailModal from "../modals/TransactionDetailModal";

export default function RendaTab({ selectedMonth }) {
  const { transactions, fetchData } = useData();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [detailModalTransaction, setDetailModalTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta renda? A ação é permanente.")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error("Erro ao excluir renda:", error);
        alert(`Ocorreu um erro ao excluir: ${error.message}`);
      } else {
        fetchData(); 
        setDetailModalTransaction(null);
      }
    }
  };

  const handleEdit = (transaction) => {
    setDetailModalTransaction(null); 
    setEditingTransaction(transaction);
    setIsNewModalOpen(true);
  };

  const handleSave = async (transactionData) => {
    const { id, ...dataToSave } = transactionData;
    let error;

    if (editingTransaction) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(dataToSave)
        .eq('id', editingTransaction.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([dataToSave]);
      error = insertError;
    }

    if (error) {
      console.error("Erro ao salvar renda:", error);
      alert(`Ocorreu um erro ao salvar: ${error.message}`);
    } else {
      fetchData(); 
      setIsNewModalOpen(false);
      setEditingTransaction(null);
    }
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setIsNewModalOpen(true);
  };

  const monthlyIncomes = transactions.filter(
    (t) => t.date && t.date.startsWith(selectedMonth) && t.type === "income"
  );
  
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  return (
    <>
      <NewIncomeModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSave}
        incomeToEdit={editingTransaction}
        selectedMonth={selectedMonth}
      />
      <TransactionDetailModal
        isOpen={!!detailModalTransaction}
        onClose={() => setDetailModalTransaction(null)}
        transaction={detailModalTransaction}
        onDelete={() => handleDelete(detailModalTransaction.id)}
        onEdit={() => handleEdit(detailModalTransaction)}
      />
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700"
          >
            <span className="material-symbols-outlined">add</span>Nova Renda
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {monthlyIncomes.length === 0 ? (
            <p className="text-gray-500">
              Nenhuma renda registrada para este mês.
            </p>
          ) : (
            <ul className="space-y-1">
              {monthlyIncomes.map((income) => (
                <li key={income.id}>
                  <button
                    onClick={() => setDetailModalTransaction(income)}
                    className="w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-gray-100"
                  >
                    <span className="text-gray-700">{income.description}</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(income.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}