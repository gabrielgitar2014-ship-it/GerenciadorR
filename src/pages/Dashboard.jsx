// src/pages/Dashboard.jsx

import { useState, useEffect, useMemo } from "react";
import { useData } from "../context/DataContext";

// Componentes
import Header from "../components/Header";
import NovaDespesaModal from "../components/modals/NovaDespesaModal";
import RelatorioModal from "../components/modals/RelatorioModal";

// Abas
import GeneralTab from "../components/tabs/Generaltab.jsx";
import DespesasTab from "../components/tabs/DespesasTab.jsx";
import RendaTab from "../components/tabs/RendaTab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import PedidosTab from "../components/tabs/PedidosTab.jsx";
import CalculadoraTab from "../components/tabs/CalculadoraTab.jsx";


const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const ErrorNotification = ({ message, onClose }) => (
  <div className="container mx-auto mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
    <span>{message}</span>
    <button onClick={onClose} className="font-bold">X</button>
  </div>
);

const mainTabIcons = {
  geral: 'dashboard',
  despesas: 'receipt_long',
  renda: 'attach_money',
  fixas: 'push_pin',
  bancos: 'credit_card',
};

const MAIN_TABS = ['geral', 'despesas', 'renda', 'fixas', 'bancos'];

export default function Dashboard() {
  const { allParcelas, loading, error, fetchData, setError, cardConfigs } = useData();
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'geral');
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [despesaParaEditar, setDespesaParaEditar] = useState(null);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const parcelasDoMesSelecionado = useMemo(() => {
    return (allParcelas || []).filter(p => p.data_parcela && p.data_parcela.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);

  const handleSync = async () => {
    try {
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error("Falha na sincronização a partir do Dashboard:", err);
      return { success: false, error: err.message };
    }
  };

  const handleClearAllData = async () => { 
    console.log("Função para limpar dados chamada.");
  };

  const handleOpenCreateModal = () => {
    setDespesaParaEditar(null);
    setIsDespesaModalOpen(true);
  };

  const handleCloseDespesaModal = () => {
    setIsDespesaModalOpen(false);
    setDespesaParaEditar(null);
  };
  
  const handleSaveDespesaSuccess = (despesaSalva, mesDeDestino) => {
    handleCloseDespesaModal();
    fetchData();
    if (selectedMonth !== mesDeDestino) {
        setSelectedMonth(mesDeDestino);
    }
  };

  const tabComponents = {
    geral: <GeneralTab selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} />,
    despesas: <DespesasTab selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />,
    renda: <RendaTab selectedMonth={selectedMonth} />,
    fixas: <FixasTab selectedMonth={selectedMonth} />,
    bancos: <BancosTab selectedMonth={selectedMonth} parcelasDoMes={parcelasDoMesSelecionado} />,
    pedidos: <PedidosTab />,
    calculadora: <CalculadoraTab />,
  };

  return (
    <div
      // CORREÇÃO: Substituí o link quebrado por um link funcional do Unsplash.
      style={{ backgroundImage: `url("https://pt.pngtree.com/freepng/financial-planning-calculating-risk-icon-concept_9151342.html" )` }}
      className="min-h-screen bg-cover bg-center bg-fixed"
    >
      <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm"></div>
      <div className="relative z-10">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onSync={handleSync}
          onClearData={handleClearAllData}
          loading={loading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenRelatorioModal={() => setIsRelatorioModalOpen(true)}
          onOpenCreateModal={handleOpenCreateModal}
        />
        
        {isRelatorioModalOpen && <RelatorioModal onClose={() => setIsRelatorioModalOpen(false)} />}
        {isDespesaModalOpen && (
          <NovaDespesaModal
            onClose={handleCloseDespesaModal}
            onSave={handleSaveDespesaSuccess}
            despesaParaEditar={despesaParaEditar}
            cardConfigs={cardConfigs}
          />
        )}

        <main className="container mx-auto p-2 md:p-4 pb-28">
          {error && <ErrorNotification message={error} onClose={() => setError(null)} />}
          {loading && activeTab !== 'pedidos' && activeTab !== 'calculadora' ? (
            <div className="text-center mt-8"><p className="font-semibold text-lg">Carregando dados...</p></div>
          ) : (
            <div className="mt-4">
              {tabComponents[activeTab]}
            </div>
          )}
        </main>
        
        <footer className="fixed bottom-4 left-4 right-4 z-20">
          <div className="container mx-auto grid grid-cols-6 bg-white shadow-xl rounded-full">
            {MAIN_TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center text-center p-2 transition-colors duration-200 ${
                    isActive ? 'text-purple-700' : 'text-gray-500 hover:text-purple-600'
                  } first:rounded-l-full last:rounded-r-full`}
                >
                  <span className="material-symbols-outlined">{mainTabIcons[tab]}</span>
                </button>
              );
            })}
          </div>
        </footer>
      </div>
    </div>
  );
}
