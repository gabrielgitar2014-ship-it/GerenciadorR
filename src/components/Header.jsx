import { useState, useRef, useEffect } from 'react';

// Componente para a mensagem de notificação (Toast)
function SyncToast({ status }) {
  if (!status.active) return null;

  const baseClasses = "fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-up z-50";
  const successClasses = "bg-green-500";
  const errorClasses = "bg-red-600";

  return (
    <div className={`${baseClasses} ${status.type === 'success' ? successClasses : errorClasses}`}>
      {status.message}
    </div>
  );
}

export default function Header({
  selectedMonth,
  setSelectedMonth,
  onSync,
  onClearData,
  loading,
  activeTab,
  setActiveTab,
  onOpenRelatorioModal
}) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ active: false, message: '', type: '' });
  const moreMenuRef = useRef(null);

  const tabIcons = {
    pedidos: 'shopping_cart',
    calculadora: 'calculate',
    sync: 'sync',
    clear: 'delete_forever',
    relatorio: 'description'
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenu-ref.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    }
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);
  
  // NOVA FUNÇÃO PARA LIDAR COM O CLIQUE DE SINCRONIZAÇÃO
  const handleSyncClick = async () => {
    setIsMoreMenuOpen(false); // Fecha o menu
    
    // A função onSync agora retorna um objeto com o status
    const result = await onSync(); 
    
    if (result.success) {
      setSyncStatus({ active: true, message: 'Sincronizado com sucesso!', type: 'success' });
    } else {
      // Usa uma mensagem de erro padrão se nenhuma for fornecida
      const errorMessage = result.error || 'Ocorreu um erro.';
      setSyncStatus({ active: true, message: `Falha na sincronização: ${errorMessage}`, type: 'error' });
    }

    // Esconde a mensagem após 3 segundos
    setTimeout(() => {
      setSyncStatus({ active: false, message: '', type: '' });
    }, 3000);
  };

  const showMonthSelector = activeTab !== "pedidos" && activeTab !== "calculadora";

  return (
    <>
      <header className="bg-purple-800 shadow-md p-4 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center gap-4">
          
          <div className="w-1/3">
            <h1 className="text-lg md:text-xl font-bold text-white truncate">
              $
            </h1>
          </div>

          <div className="w-1/3 flex justify-center">
            {showMonthSelector && (
              <div className="bg-black bg-opacity-20 p-1 rounded-lg">
                 <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white font-semibold border-none focus:ring-0"
                />
              </div>
            )}
          </div>

          <div className="w-1/3 flex justify-end items-center">
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-2 text-white rounded-full hover:bg-black hover:bg-opacity-20"
                title="Mais Opções"
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>

              {isMoreMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-30 animate-fade-in-down">
                  <button
                    onClick={() => { onOpenRelatorioModal(); setIsMoreMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="material-symbols-outlined">{tabIcons.relatorio}</span>
                    Gerar Relatório
                  </button>

                  <hr className="my-1" />

                  <button
                    onClick={() => { setActiveTab('pedidos'); setIsMoreMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="material-symbols-outlined">{tabIcons.pedidos}</span>
                    Pedidos
                  </button>
                  <button
                    onClick={() => { setActiveTab('calculadora'); setIsMoreMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="material-symbols-outlined">{tabIcons.calculadora}</span>
                    Calculadora
                  </button>
                  
                  <hr className="my-1" />

                  {/* O BOTÃO AGORA CHAMA A NOVA FUNÇÃO handleSyncClick */}
                  <button
                    onClick={handleSyncClick}
                    disabled={loading}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>{tabIcons.sync}</span>
                    {loading ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                  <button
                    onClick={() => { onClearData(); setIsMoreMenuOpen(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <span className="material-symbols-outlined">{tabIcons.clear}</span>
                    Limpar Tudo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* O COMPONENTE DA MENSAGEM É RENDERIZADO AQUI */}
      <SyncToast status={syncStatus} />
    </>
  );
}