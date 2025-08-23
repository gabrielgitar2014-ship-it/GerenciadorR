import { useState, useEffect } from "react";

export default function NewIncomeModal({
  isOpen,
  onClose,
  onSave,
  incomeToEdit,
  selectedMonth,
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    selectedMonth
      ? `${selectedMonth}-01`
      : new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (isOpen) {
      if (incomeToEdit) {
        setDescription(incomeToEdit.description);
        setAmount(incomeToEdit.amount);
        setDate(incomeToEdit.date);
      } else {
        setDescription("");
        setAmount("");
        setDate(
          selectedMonth
            ? `${selectedMonth}-01`
            : new Date().toISOString().split("T")[0]
        );
      }
    }
  }, [incomeToEdit, isOpen, selectedMonth]);

  const handleSave = () => {
    if (!description || !amount) {
      alert("Preencha todos os campos.");
      return;
    }
    const incomeData = {
      description,
      amount: parseFloat(amount),
      date,
      type: "income",
    };
    onSave(incomeData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {incomeToEdit ? "Editar Renda" : "Nova Renda"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Venda de item"
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Valor (R$)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 bg-blue-600 text-white rounded-md"
          >
            Salvar Renda
          </button>
        </div>
      </div>
    </div>
  );
}
