import React from 'react';

// --- Funções Auxiliares ---
const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ --';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
};

// --- Componente Auxiliar para Itens de Detalhe ---
const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start text-gray-700 py-2">
    <span className="material-symbols-outlined text-gray-500 mr-3 mt-1">{icon}</span>
    <div className="flex-1">
      <p className="font-semibold text-sm text-gray-600">{label}</p>
      <p className="text-gray-900">{children}</p>
    </div>
  </div>
);

export default function DespesasDetalhesModal({ isOpen, onClose, onEdit, onDelete, parcela }) {
    if (!isOpen || !parcela) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in-up">
                
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                    <h2 className="text-xl font-bold text-gray-800 text-left flex-1 truncate" title={parcela.description}>
                        {parcela.description}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <span className="material-symbols-outlined text-gray-600">close</span>
                    </button>
                </div>

                <div className="space-y-1">
                    <DetailItem icon="shopping_cart" label="Valor Total da Compra">
                        <span className="font-bold text-lg text-red-600">
                            {formatCurrency(parcela.isParcelada ? parcela.valorTotalCompra : parcela.amount)}
                        </span>
                    </DetailItem>

                    {/* --- ALTERAÇÃO PRINCIPAL --- */}
                    {/* Apenas a Data da Compra é exibida como data principal */}
                    <DetailItem icon="calendar_today" label="Data da Compra">
                        {formatDate(parcela.data_compra)}
                    </DetailItem>
                    
                    <DetailItem icon="credit_card" label="Método de Pagamento">
                        {parcela.metodo_pagamento}
                    </DetailItem>

                    <DetailItem icon="task_alt" label="Status">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${parcela.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {parcela.paid ? 'Pago' : 'Pendente'}
                        </span>
                    </DetailItem>

                    {parcela.isParcelada && (
                        <div className="pt-3 mt-3 border-t">
                            <h3 className="text-md font-bold text-blue-700 mb-2">Detalhes do Parcelamento</h3>
                            <DetailItem icon="receipt_long" label="Parcela Atual">
                                {parcela.parcelaInfo}
                            </DetailItem>
                            <DetailItem icon="payments" label="Valor da Parcela">
                                <span className="font-semibold">{formatCurrency(parcela.amount)}</span>
                            </DetailItem>
                            <DetailItem icon="event_repeat" label="Previsão de Término">
                                {parcela.endDate}
                            </DetailItem>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-4 border-t pt-4">
                    <button onClick={onDelete} className="flex items-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                        Excluir
                    </button>
                    <button onClick={onEdit} className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <span className="material-symbols-outlined">edit</span>
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
}