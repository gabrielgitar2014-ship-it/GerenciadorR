// src/components/tabs/BancosTab.jsx

import React, { useState, useMemo } from 'react';
import { useData } from "../../context/DataContext";
import BancoDetalhesModal from '../modals/BancoDetalhesModal';
import CardConfigModal from '../modals/CardConfigModal';
import DespesasCartaoModal from '../modals/DespesasCartaoModal';

// --- COMPONENTE AUXILIAR PARA RESULTADOS DA BUSCA ---
const SearchResultItem = ({ item }) => (
    <div className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
        <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800">{item.description}</p>
            <span className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="flex justify-between items-center mt-1 text-sm">
            <span className="text-red-600 font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount)}</span>
            <span className="text-gray-500">{item.metodo_pagamento}</span>
        </div>
        <div className="flex justify-between items-center mt-1 text-xs">
            {item.parcelaInfo && (
                <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full inline-block">
                    Parcela {item.parcelaInfo}
                </span>
            )}
            {item.totalAmount && item.totalAmount !== item.amount && (
                 <span className="text-gray-500">
                    Valor Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.totalAmount)}
                </span>
            )}
        </div>
    </div>
);

export default function BancosTab({ selectedMonth, parcelasDoMes = [] }) {
    // Usamos 'allParcelas' e 'transactions' para a busca global
    const { transactions = [], allParcelas, cardConfigs, fetchData } = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [detailModalInfo, setDetailModalInfo] = useState({ isOpen: false, bancoNome: null, valorTotalParcelado: 0 });
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedCardForConfig, setSelectedCardForConfig] = useState(null);
    const [despesasModalInfo, setDespesasModalInfo] = useState({ isOpen: false, bancoNome: '', despesas: [] });

    // --- LÓGICA DE BUSCA GLOBAL ---
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return null; // Não busca se o campo estiver vazio

        const term = searchTerm.toLowerCase();
        const searchNumber = parseFloat(term.replace(',', '.'));
        const isNumericSearch = !isNaN(searchNumber) && isFinite(searchNumber);

        // 1. Usa 'allParcelas' para pegar TODAS as despesas variáveis
        const despesasVariaveis = allParcelas.map(p => ({
            id: `p-${p.id}`,
            description: p.despesas?.description,
            amount: p.amount, // Valor da parcela
            totalAmount: p.despesas?.amount, // Valor total da despesa
            metodo_pagamento: p.despesas?.metodo_pagamento,
            date: p.data_parcela, // Data da parcela para exibição
            parcelaInfo: p.despesas?.qtd_parcelas > 1 ? `${p.numero_parcela}/${p.despesas.qtd_parcelas}` : null
        }));

        // 2. Usa 'transactions' para pegar TODAS as despesas fixas
        const despesasFixas = transactions.filter(t => t.type === "expense" && t.is_fixed).map(t => ({
            id: `t-${t.id}`,
            description: t.description,
            amount: t.amount,
            totalAmount: t.amount,
            metodo_pagamento: t.metodo_pagamento,
            date: t.date,
            parcelaInfo: null
        }));

        const todasAsDespesas = [...despesasVariaveis, ...despesasFixas];

        // 3. Filtra o array global
        return todasAsDespesas.filter(item => {
            if (!item.description) return false;
            const descriptionMatch = item.description.toLowerCase().includes(term);
            if (isNumericSearch) {
                const amountMatch = item.amount === searchNumber || item.totalAmount === searchNumber;
                return descriptionMatch || amountMatch;
            }
            return descriptionMatch;
        });
    }, [searchTerm, allParcelas, transactions]); // Depende dos dados globais, não dos dados do mês

    // --- O RESTANTE DO CÓDIGO PERMANECE O MESMO ---
    // Ele continua funcionando para a visualização do mês quando não há busca.
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    const bancoConfig = { 'Bradesco': { color: 'border-red-600' }, 'Itaú': { color: 'border-orange-500' }, 'Nubank': { color: 'border-purple-600' }, 'Pix': { color: 'border-cyan-500' }, 'Default': { color: 'border-gray-400' } };
    const PIX = "Pix";
    const BANCOS_PRINCIPAIS = ["Bradesco", "Itaú", "Nubank"];
    const metodosDasParcelas = parcelasDoMes.map(p => p.despesas?.metodo_pagamento);
    const metodosDasFixas = transactions.filter(t => t.date?.startsWith(selectedMonth) && t.type === "expense" && t.is_fixed).map(t => t.metodo_pagamento);
    const todosMetodosDePagamento = [...new Set([...metodosDasParcelas, ...metodosDasFixas])].filter(Boolean);
    const bancosParaExibir = [...new Set([...BANCOS_PRINCIPAIS, ...todosMetodosDePagamento])].filter(metodo => metodo !== PIX);
    const calcularMetricasMensais = (nomeDoBanco) => {
        const parcelasVariaveisDoBanco = parcelasDoMes.filter(p => p.despesas?.metodo_pagamento === nomeDoBanco);
        const parcelados = parcelasVariaveisDoBanco.filter(p => p.despesas?.qtd_parcelas > 1).reduce((acc, p) => acc + (p.amount || 0), 0);
        const avulsosVariaveis = parcelasVariaveisDoBanco.filter(p => p.despesas?.qtd_parcelas <= 1).reduce((acc, p) => acc + (p.amount || 0), 0);
        const avulsosFixos = transactions.filter(t => t.date?.startsWith(selectedMonth) && t.type === "expense" && t.is_fixed && t.metodo_pagamento === nomeDoBanco).reduce((acc, t) => acc + (t.amount || 0), 0);
        const totalAvulsos = avulsosVariaveis + avulsosFixos;
        return { parcelados: parcelados || 0, avulsos: totalAvulsos || 0, total: (parcelados || 0) + (totalAvulsos || 0) };
    };
    const calcularSaldoDevedorParcelado = (nomeDoBanco) => {
        const [anoSelecionado, mesSelecionado] = selectedMonth.split('-').map(Number);
        const dataInicioCalculo = new Date(anoSelecionado, mesSelecionado - 1, 1);
        return allParcelas.filter(p => {
            const [ano, mes, dia] = p.data_parcela.split('-').map(Number);
            const dataParcela = new Date(ano, mes - 1, dia);
            return p.despesas?.metodo_pagamento === nomeDoBanco && p.despesas?.qtd_parcelas > 1 && dataParcela >= dataInicioCalculo;
        }).reduce((total, p) => total + p.amount, 0);
    };
    const handleOpenDespesasModal = (bancoNome) => {
        const despesasVariaveis = parcelasDoMes.filter(p => p.despesas?.metodo_pagamento === bancoNome).map(p => ({ description: p.despesas.description, amount: p.amount, date: p.despesas.data_compra, parcelaInfo: p.despesas.qtd_parcelas > 1 ? `${p.numero_parcela}/${p.despesas.qtd_parcelas}` : null }));
        const despesasFixas = transactions.filter(t => t.date?.startsWith(selectedMonth) && t.type === "expense" && t.is_fixed && t.metodo_pagamento === bancoNome).map(t => ({ description: t.description, amount: t.amount, date: t.date, parcelaInfo: null }));
        const todasAsDespesas = [...despesasVariaveis, ...despesasFixas].sort((a, b) => new Date(b.date) - new Date(a.date));
        setDespesasModalInfo({ isOpen: true, bancoNome, despesas: todasAsDespesas });
    };
    const metricasPix = calcularMetricasMensais(PIX);
    const handleCloseDespesasModal = () => setDespesasModalInfo({ isOpen: false, bancoNome: '', despesas: [] });
    const handleOpenDetailModal = (e, bancoNome) => { e.stopPropagation(); setDetailModalInfo({ isOpen: true, bancoNome: bancoNome, valorTotalParcelado: calcularSaldoDevedorParcelado(bancoNome) }); };
    const handleCloseDetailModal = () => setDetailModalInfo({ isOpen: false, bancoNome: null, valorTotalParcelado: 0 });
    const handleOpenConfigModal = (e, bancoNome) => { e.stopPropagation(); setSelectedCardForConfig(bancoNome); setIsConfigModalOpen(true); };
    const handleCloseConfigModal = () => { setSelectedCardForConfig(null); setIsConfigModalOpen(false); };

    return (
        <>
            <BancoDetalhesModal isOpen={detailModalInfo.isOpen} onClose={handleCloseDetailModal} bancoNome={detailModalInfo.bancoNome} valorTotalParcelado={detailModalInfo.valorTotalParcelado} />
            <CardConfigModal isOpen={isConfigModalOpen} onClose={handleCloseConfigModal} onSave={fetchData} cardName={selectedCardForConfig} initialConfig={cardConfigs.find(c => c.card_name === selectedCardForConfig)} />
            <DespesasCartaoModal isOpen={despesasModalInfo.isOpen} onClose={handleCloseDespesasModal} bancoNome={despesasModalInfo.bancoNome} despesas={despesasModalInfo.despesas} />

            <div className="space-y-8">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-500">search</span>
                        <input
                            type="text"
                            placeholder="Buscar em todas as despesas (descrição ou valor)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-lg border-0 focus:ring-0 p-1"
                        />
                    </div>
                </div>

                {searchResults ? (
                    <div className="bg-white rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 p-4 border-b">
                            Resultados da Busca Global ({searchResults.length})
                        </h2>
                        <div className="max-h-[70vh] overflow-y-auto">
                            {searchResults.length > 0 ? (
                                searchResults.map(item => <SearchResultItem key={item.id} item={item} />)
                            ) : (
                                <p className="text-center text-gray-500 p-8">Nenhum resultado encontrado.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumo do Mês Selecionado</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bancosParaExibir.map(banco => {
                                    const metricas = calcularMetricasMensais(banco);
                                    if (!metricas || metricas.total === 0) return null;
                                    const config = bancoConfig[banco] || bancoConfig['Default'];
                                    return (
                                        <div key={banco} className={`bg-white rounded-lg p-5 shadow-sm border-b-4 ${config.color} cursor-pointer hover:shadow-lg transition-shadow duration-200`} onClick={() => handleOpenDespesasModal(banco)}>
                                            <div className="flex justify-between items-start mb-4"><h3 className="font-bold text-xl text-gray-700">{banco}</h3><div className="flex items-center gap-2"><button onClick={(e) => handleOpenConfigModal(e, banco)} className="p-1 text-gray-400 hover:text-blue-600" title="Configurar Cartão"><span className="material-symbols-outlined">edit</span></button><button onClick={(e) => handleOpenDetailModal(e, banco)} className="p-1 text-gray-400 hover:text-green-600" title="Ver Detalhes da Dívida"><span className="material-symbols-outlined">visibility</span></button></div></div>
                                            <div className="space-y-3"><div className="flex justify-between items-center text-sm"><span className="text-gray-500">Gastos Avulsos</span><span className="font-semibold text-gray-800">{formatCurrency(metricas.avulsos)}</span></div><div className="flex justify-between items-center text-sm"><span className="text-gray-500">Parcelas do Mês</span><span className="font-semibold text-gray-800">{formatCurrency(metricas.parcelados)}</span></div><hr className="my-2"/><div className="flex justify-between items-center text-base"><span className="font-bold text-gray-600">Total na Fatura</span><span className="font-bold text-red-600">{formatCurrency(metricas.total)}</span></div></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {metricasPix.total > 0 && (
                            <div>
                                <div className="bg-white border rounded-lg p-5 shadow-sm">
                                    <div className="flex justify-between items-center"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-cyan-600 text-3xl">qr_code_2</span><span className="font-bold text-xl text-gray-700">Total Gasto com Pix</span></div><span className="font-bold text-2xl text-red-600">{formatCurrency(metricasPix.total)}</span></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
