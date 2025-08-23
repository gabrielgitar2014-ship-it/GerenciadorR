import { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { supabase } from "../../supabaseClient";
import NovaDespesaModal from "../modals/NovaDespesaModal.jsx";
import DespesasDetalhesModal from "../modals/DespesasDetalhesModal.jsx";
import SearchBar from "../SearchBar";
import Pagination from "../Pagination";
import { usePagination } from "../../hooks/usePagination";

export default function DespesasTab({ selectedMonth, setSelectedMonth }) {
    const { allParcelas, cardConfigs, fetchData, loading } = useData();

    const [selectedCard, setSelectedCard] = useState('todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [despesaParaEditar, setDespesaParaEditar] = useState(null);
    const [parcelaSelecionada, setParcelaSelecionada] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showOnlyInstallments, setShowOnlyInstallments] = useState(false);
    const [sortOption, setSortOption] = useState('date-desc');

    const parcelasDoMes = useMemo(() => {
        if (!selectedMonth) return [];
        return allParcelas.filter(p => p.data_parcela && p.data_parcela.startsWith(selectedMonth));
    }, [selectedMonth, allParcelas]);
    
    const sortedData = useMemo(() => {
        const sortableData = [...parcelasDoMes];
        switch (sortOption) {
            case 'date-asc':
                sortableData.sort((a, b) => new Date(a.despesas?.data_compra || a.data_parcela) - new Date(b.despesas?.data_compra || b.data_parcela));
                break;
            case 'alpha-asc':
                sortableData.sort((a, b) => (a.despesas?.description || '').localeCompare(b.despesas?.description || ''));
                break;
            case 'alpha-desc':
                sortableData.sort((a, b) => (b.despesas?.description || '').localeCompare(a.despesas?.description || ''));
                break;
            case 'date-desc':
            default:
                sortableData.sort((a, b) => new Date(b.despesas?.data_compra || b.data_parcela) - new Date(a.despesas?.data_compra || a.data_parcela));
                break;
        }
        return sortableData;
    }, [parcelasDoMes, sortOption]);

    const cardOptions = useMemo(() => {
        const methods = sortedData.map(p => p.despesas?.metodo_pagamento).filter(Boolean);
        return [...new Set(methods)];
    }, [sortedData]);

    const filteredByCard = useMemo(() => {
        if (selectedCard === 'todos') return sortedData;
        return sortedData.filter(p => p.despesas?.metodo_pagamento === selectedCard);
    }, [sortedData, selectedCard]);

    const finalFilteredData = useMemo(() => {
        if (!showOnlyInstallments) return filteredByCard;
        return filteredByCard.filter(p => p.despesas?.qtd_parcelas > 1);
    }, [filteredByCard, showOnlyInstallments]);
    
    const summary = useMemo(() => {
        const total = finalFilteredData.reduce((acc, p) => acc + p.amount, 0);
        return { total };
    }, [finalFilteredData]);

    const customFilter = (parcela, searchTerm) => {
        if (!searchTerm) return true;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const normalizedSearchTerm = lowerCaseSearchTerm.replace(',', '.');
        const description = parcela.despesas?.description?.toLowerCase() || '';
        const descriptionMatch = description.includes(lowerCaseSearchTerm);
        const amountAsString = String(parcela.amount);
        const amountMatch = amountAsString.includes(normalizedSearchTerm);
        return descriptionMatch || amountMatch;
    };

    const { currentData, searchTerm, setSearchTerm, currentPage, totalPages, handlePageChange } = usePagination(
        finalFilteredData, { itemsPerPage: 10, filterFn: customFilter }
    );

    const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
    
    const handleOpenDetailModal = (parcela) => {
        const despesas = parcela.despesas;
        if (!despesas) {
            console.error("Dados da despesa original não encontrados.", parcela);
            return; 
        }

        const qtd_parcelas = parseInt(despesas.qtd_parcelas, 10) || 1;
        const mesInicioCobranca = despesas.mes_inicio_cobranca;

        const parcelaInfo = `${parcela.numero_parcela} de ${qtd_parcelas}`;

        let endDate = "N/A";

        if (qtd_parcelas > 1 && mesInicioCobranca) {
            const [ano, mes] = mesInicioCobranca.split('-').map(Number);
            let dataBaseParaCalculo = new Date(Date.UTC(ano, mes - 1, 1));
            
            dataBaseParaCalculo.setUTCMonth(dataBaseParaCalculo.getUTCMonth() + qtd_parcelas);
            
            endDate = dataBaseParaCalculo.toLocaleDateString("pt-BR", { 
                month: "long", 
                year: "numeric", 
                timeZone: "UTC" 
            });
        }

        const transactionDataForModal = {
            id: parcela.id,
            description: despesas.description || 'Despesa sem descrição',
            amount: parcela.amount,
            metodo_pagamento: despesas.metodo_pagamento || 'N/A',
            isParcelada: qtd_parcelas > 1,
            parcelaInfo: parcelaInfo,
            valorTotalCompra: despesas.amount || parcela.amount,
            data_compra: despesas.data_compra,
            endDate: endDate,
            despesas: despesas, 
            originalParcela: parcela
        };
        setParcelaSelecionada(transactionDataForModal);
    };

    const handleOpenEditModal = (transaction) => {
        const originalParcela = transaction.originalParcela || parcelasDoMes.find(p => p.id === transaction.id);
        if (!originalParcela?.despesas) {
            alert("Não é possível editar. Detalhes da despesa original não encontrados.");
            return;
        }
        setParcelaSelecionada(null);
        setDespesaParaEditar(originalParcela.despesas);
        setIsModalOpen(true);
    };

    const handleDeleteSingle = async (transaction) => {
        const despesaId = transaction.originalParcela?.despesas?.id;
        if (!despesaId) {
            alert("Não é possível excluir. ID da despesa original não encontrado.");
            return;
        }
        if (window.confirm(`Excluir "${transaction.description}"? Isso removerá a despesa e TODAS as suas parcelas.`)) {
            const { error: parcelasError } = await supabase.from('parcelas').delete().eq('despesa_id', despesaId);
            if (parcelasError) {
                alert(`Erro ao excluir as parcelas: ${parcelasError.message}`);
                return;
            }
            const { error: despesaError } = await supabase.from('despesas').delete().eq('id', despesaId);
            if (despesaError) {
                alert(`Erro ao excluir a despesa: ${despesaError.message}`);
            } else {
                alert("Despesa excluída com sucesso.");
                fetchData();
                handleCloseAllModals();
            }
        }
    };

    const handleCloseAllModals = () => {
        setIsModalOpen(false);
        setDespesaParaEditar(null);
        setParcelaSelecionada(null);
    };

    const handleSaveSuccess = (despesaSalva, mesDeDestino) => {
        handleCloseAllModals();
        fetchData();
        if (selectedMonth !== mesDeDestino) {
            setSelectedMonth(mesDeDestino);
        }
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedItems(new Set());
    };

    const handleSelectItem = (despesaId) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(despesaId)) {
            newSelection.delete(despesaId);
        } else {
            newSelection.add(despesaId);
        }
        setSelectedItems(newSelection);
    };

    const handleDeleteSelected = async () => {
        const idsToDelete = Array.from(selectedItems);
        if (idsToDelete.length === 0) return;
        
        if (window.confirm(`Tem certeza que deseja excluir as ${idsToDelete.length} despesas selecionadas e TODAS as suas parcelas?`)) {
            const { error: parcelasError } = await supabase.from('parcelas').delete().in('despesa_id', idsToDelete);
            if (parcelasError) {
                alert(`Erro ao excluir as parcelas: ${parcelasError.message}`);
                return;
            }
            
            const { error: despesasError } = await supabase.from('despesas').delete().in('id', idsToDelete);
            if (despesasError) {
                alert(`Erro ao excluir despesas: ${despesasError.message}`);
            } else {
                alert("Despesas selecionadas foram excluídas com sucesso.");
                fetchData();
                toggleSelectionMode();
            }
        }
    };
    
    const handleOpenCreateModal = () => { 
        setDespesaParaEditar(null); 
        setIsModalOpen(true); 
    };

    const formatarData = (data) => {
        if (!data) return '';
        const date = new Date(data);
        date.setUTCDate(date.getUTCDate() + 1);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciador de Despesas</h2>
                <div className="flex items-center gap-2">
                    {selectionMode ? (
                        <button onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Excluir ({selectedItems.size})</button>
                    ) : (
                        <button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Nova Despesa</button>
                    )}
                    <button onClick={toggleSelectionMode} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">{selectionMode ? 'Cancelar' : 'Selecionar'}</button>
                </div>
            </div>

            <div className="mb-6">
                <div className="bg-slate-100 p-3 rounded-lg shadow-sm">
                    <h4 className="text-sm text-slate-500 font-semibold">Total no Mês</h4>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(summary.total)}</p>
                </div>
            </div>

            {isModalOpen && <NovaDespesaModal onClose={handleCloseAllModals} onSave={handleSaveSuccess} despesaParaEditar={despesaParaEditar} cardConfigs={cardConfigs} />}
            
            <DespesasDetalhesModal 
                isOpen={!!parcelaSelecionada} 
                onClose={handleCloseAllModals} 
                parcela={parcelaSelecionada} 
                onDelete={() => handleDeleteSingle(parcelaSelecionada)} 
                onEdit={() => handleOpenEditModal(parcelaSelecionada)} 
            />

            <div className="mt-2 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="date-desc">Ordenar por: Mais Recentes</option>
                        <option value="date-asc">Ordenar por: Mais Antigas</option>
                        <option value="alpha-asc">Ordenar por: Descrição (A-Z)</option>
                        <option value="alpha-desc">Ordenar por: Descrição (Z-A)</option>
                    </select>
                    <select
                        value={selectedCard}
                        onChange={(e) => setSelectedCard(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="todos">Filtrar por Cartão</option>
                        {cardOptions.map(card => <option key={card} value={card}>{card}</option>)}
                    </select>
                    <div className="md:col-span-2 flex items-center">
                        <input
                            type="checkbox"
                            id="parceladas"
                            checked={showOnlyInstallments}
                            onChange={(e) => setShowOnlyInstallments(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="parceladas" className="ml-2 text-sm font-medium text-gray-700">Mostrar apenas parceladas</label>
                    </div>
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

                <div className="space-y-3 min-h-[300px]">
                    {loading && parcelasDoMes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">A carregar despesas...</div>
                    ) : currentData.length > 0 ? (
                        currentData.map(parcela => {
                            const isSelected = selectedItems.has(parcela.despesas?.id);
                            // A variável 'displayDate' não é mais necessária aqui, mas não prejudica mantê-la.
                            const displayDate = parcela.despesas?.data_compra || parcela.data_parcela;
                            return (
                                <div key={parcela.id} onClick={() => !selectionMode && handleOpenDetailModal(parcela)} className={`flex items-center bg-gray-50 p-4 rounded-lg shadow-sm transition-all duration-200 ${selectionMode ? 'cursor-pointer' : 'hover:shadow-md'} ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}>
                                    {selectionMode && (
                                        <div className="mr-4 flex-shrink-0">
                                            <input type="checkbox" checked={isSelected} onChange={() => parcela.despesas && handleSelectItem(parcela.despesas.id)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                        </div>
                                    )}
                                    <div className="flex-1 text-left w-full min-w-0">
                                        {/* =================================================================== */}
                                        {/* INÍCIO DA ALTERAÇÃO                       */}
                                        {/* =================================================================== */}
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-800 truncate">{parcela.despesas?.description || 'Descrição indisponível'}</p>
                                            {/* LINHA DA DATA REMOVIDA DAQUI */}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {/* Agora mostra apenas o método de pagamento (banco) */}
                                            {parcela.despesas?.metodo_pagamento}
                                            {/* CONTADOR DE PARCELA REMOVIDO DAQUI */}
                                        </p>
                                        {/* =================================================================== */}
                                        {/* FIM DA ALTERAÇÃO                          */}
                                        {/* =================================================================== */}
                                    </div>
                                    <div className="flex items-center w-auto ml-4">
                                        <p className="text-lg font-semibold text-red-600 mr-4">{formatCurrency(parcela.amount)}</p>
                                        {!selectionMode && (
                                            <div className="flex items-center space-x-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal({ originalParcela: parcela }); }} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-200" title="Editar"><span className="material-symbols-outlined">edit</span></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSingle({ description: parcela.despesas?.description, originalParcela: parcela }); }} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-200" title="Excluir"><span className="material-symbols-outlined">delete</span></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500">Nenhuma despesa encontrada para este mês ou filtro.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
