// ARQUIVO: src/context/DataContext.jsx

import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { supabase } from '../supabaseClient';

// 1. Cria o Contexto
const DataContext = createContext();

// Hook customizado para facilitar o uso do contexto em outros componentes
export const useData = () => useContext(DataContext);

// 2. Cria o "Provedor" que vai gerenciar e fornecer os dados
export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [allParcelas, setAllParcelas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cardConfigs, setCardConfigs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Estado para feedback de erros

  async function fetchData() {
    console.log("Buscando todos os dados atualizados...");
    setLoading(true);
    setError(null); // Limpa erros antigos antes de buscar
    
    try {
      const [
        transactionsResponse,
        parcelasResponse,
        pedidosResponse,
        cardConfigsResponse
      ] = await Promise.all([
        supabase.from("transactions").select("*"),
        supabase.from("parcelas").select(`*, despesas ( * )`),
        supabase.from("pedidos").select("*"),
        supabase.from("card_configs").select("*")
      ]);

      // Valida cada resposta individualmente
      if (transactionsResponse.error) throw transactionsResponse.error;
      setTransactions(transactionsResponse.data || []);
      
      if (parcelasResponse.error) throw parcelasResponse.error;
      setAllParcelas(parcelasResponse.data || []);
      
      if (pedidosResponse.error) throw pedidosResponse.error;
      setPedidos(pedidosResponse.data || []);
      
      if (cardConfigsResponse.error) throw cardConfigsResponse.error;
      setCardConfigs(cardConfigsResponse.data || []);

    } catch (err) {
      console.error("Erro detalhado ao buscar dados:", err);
      setError("Falha ao sincronizar os dados. Verifique sua conexão e tente novamente."); // Mensagem amigável para o usuário
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Cria um objeto com todos os valores que queremos fornecer para a aplicação
  const value = {
    transactions,
    allParcelas,
    pedidos,
    cardConfigs,
    loading,
    error,
    fetchData // Fornece a própria função para que outros componentes possam chamar a sincronização
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};