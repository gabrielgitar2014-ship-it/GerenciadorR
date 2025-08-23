import { useState, useEffect, useMemo } from "react";
import { useData } from "../context/DataContext";

import Header from "../components/Header";
import GeneralTab from "../components/tabs/Generaltab.jsx";
import DespesasTab from "../components/tabs/DespesasTab.jsx";
import RendaTab from "../components/tabs/RendaTab.jsx";
import FixasTab from "../components/tabs/FixasTab.jsx";
import BancosTab from "../components/tabs/BancosTab.jsx";
import PedidosTab from "../components/tabs/PedidosTab.jsx";
import CalculadoraTab from "../components/tabs/CalculadoraTab.jsx";
import RelatorioModal from "../components/modals/RelatorioModal";

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
  const { allParcelas, loading, error, fetchData, setError } = useData(); // Adicionado setError para limpar erros se necessário
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'geral');
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const parcelasDoMesSelecionado = useMemo(() => {
    if (!selectedMonth) return [];
    return allParcelas.filter(p => p.data_parcela && p.data_parcela.startsWith(selectedMonth));
  }, [selectedMonth, allParcelas]);

  // ===================================================================
  //                      INÍCIO DA MODIFICAÇÃO
  // ===================================================================
  // 1. Criamos a nova função 'handleSync'
  //    Ela é 'async' e usa um bloco try...catch para detectar sucesso ou falha.
  const handleSync = async () => {
    try {
      await fetchData(); // Chama a função original de busca de dados
      return { success: true }; // Se fetchData funcionar, retorna sucesso
    } catch (err) {
      console.error("Falha na sincronização a partir do Dashboard:", err);
      // Se fetchData falhar (lançar um erro), o catch captura.
      return { success: false, error: err.message }; // Retorna falha e a mensagem de erro
    }
  };
  // ===================================================================
  //                        FIM DA MODIFICAÇÃO
  // ===================================================================

  const handleClearAllData = async () => { /* ... sua lógica de limpar dados ... */ };

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
      style={{ backgroundImage: `url("https://cdn.quantosobra.com.br/qs-site/uploads/2021/08/bg-sistema-de-gestao-1.png")` }}
      className="min-h-screen bg-cover bg-center bg-fixed"
    >
      <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm"></div>
      <div className="relative z-10">
        <Header
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          // 2. Passamos a nova função 'handleSync' para a prop onSync
          onSync={handleSync}
          onClearData={handleClearAllData}
          loading={loading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenRelatorioModal={() => setIsRelatorioModalOpen(true)}
        />
        
        {isRelatorioModalOpen && <RelatorioModal onClose={() => setIsRelatorioModalOpen(false)} />}

        <main className="container mx-auto p-2 md:p-4 pb-28">
          {error && <ErrorNotification message={error} onClose={() => setError(null)} />}

          <div className="mt-4">
            {tabComponents[activeTab]}
          </div>
        </main>
        
        <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-20">
          <div className="container mx-auto grid grid-cols-5">
            {MAIN_TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center text-center p-2 transition-colors duration-200 ${
                    isActive ? 'text-purple-700' : 'text-gray-500 hover:text-purple-600'
                  }`}
                >
                  <span className="material-symbols-outlined">{mainTabIcons[tab]}</span>
                  <span className="text-xs font-semibold">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </button>
              );
            })}
          </div>
        </footer>
      </div>
    </div>
  );
}