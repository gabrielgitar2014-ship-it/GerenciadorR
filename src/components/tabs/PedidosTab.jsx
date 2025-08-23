import { useState } from "react";
import { useData } from "../../context/DataContext";
import { supabase } from "../../supabaseClient";
import NewPedidoModal from "../modals/NewPedidoModal";

export default function PedidosTab() {
  const { pedidos, fetchData } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);

  const handleApprove = async (id) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'aprovado' })
      .eq('id', id);
    if (error) alert(`Erro: ${error.message}`);
    else fetchData(); 
  };

  const handleDecline = async (id) => {
    const reason = prompt("Por favor, informe o motivo da recusa:");
    if (reason) {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'recusado', decline_reason: reason })
        .eq('id', id);
      if (error) alert(`Erro: ${error.message}`);
      else fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este pedido?")) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (error) alert(`Erro: ${error.message}`);
      else fetchData();
    }
  };

  const handleEdit = (pedido) => {
    setEditingPedido(pedido);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPedido(null);
    setIsModalOpen(true);
  };

  const handleSavePedido = async (pedidoData) => {
    let error;
    if (editingPedido) {
      const { error: updateError } = await supabase
        .from('pedidos')
        .update(pedidoData)
        .eq('id', editingPedido.id);
      error = updateError;
    } else {
      const dataToInsert = { ...pedidoData, status: 'pendente' };
      const { error: insertError } = await supabase
        .from('pedidos')
        .insert([dataToInsert]);
      error = insertError;
    }

    if (error) {
      alert(`Erro ao salvar pedido: ${error.message}`);
    } else {
      fetchData();
      setIsModalOpen(false);
      setEditingPedido(null);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
    
  const getStatusClass = (status) => {
    if (status === "aprovado") return "bg-green-100 text-green-800";
    if (status === "recusado") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <>
      <NewPedidoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePedido}
        pedidoToEdit={editingPedido}
      />

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">
            Pedidos de Compra
          </h2>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            <span className="material-symbols-outlined">add_shopping_cart</span>
            Novo Pedido
          </button>
        </div>

        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {pedido.justification}
                  </p>
                  <p className="font-bold text-blue-600 text-lg">
                    {formatCurrency(pedido.value)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusClass(
                    pedido.status
                  )}`}
                >
                  {pedido.status}
                </span>
              </div>
              {pedido.status === "recusado" && (
                <p className="text-sm text-red-600 mt-2">
                  <b>Motivo:</b> {pedido.decline_reason}
                </p>
              )}
              {pedido.status === "pendente" && (
                <div className="flex flex-wrap justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleDelete(pedido.id)}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => handleEdit(pedido)}
                    className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDecline(pedido.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Recusar
                  </button>
                  <button
                    onClick={() => handleApprove(pedido.id)}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Aprovar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}