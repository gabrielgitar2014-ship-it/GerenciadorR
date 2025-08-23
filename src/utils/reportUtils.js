// Esta função "pura" recebe todos os dados e os filtros, e retorna os dados processados.
// Isso centraliza a lógica de negócio e facilita testes futuros.

const parseDateString = (dateString) => {
    if (typeof dateString !== 'string' || dateString.length < 10) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(p => parseInt(p, 10));
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
        return date;
    }
    return null;
};

export const processarDadosRelatorio = (allParcelas, filtros) => {
    const { startDate, endDate, metodoPagamento, categoria, apenasParceladas } = filtros;

    const start = parseDateString(startDate);
    const end = parseDateString(endDate);

    if (!start || !end || !Array.isArray(allParcelas)) {
        console.error('Erro: Datas inválidas ou `allParcelas` não é um array.');
        return null;
    }
    end.setUTCHours(23, 59, 59, 999);

    let despesasFiltradas = allParcelas.filter(p => {
        // Assumindo que o campo da data da compra é 'data_compra'
        const dataCompra = parseDateString(p.despesas?.data_compra);
        if (!dataCompra) return false;

        const dentroDoPeriodo = dataCompra >= start && dataCompra <= end;
        const metodoOk = metodoPagamento === 'todos' || p.despesas?.metodo_pagamento === metodoPagamento;
        // NOVO: Lógica para o filtro de categoria
        const categoriaOk = categoria === 'todas' || p.despesas?.categoria === categoria;

        return dentroDoPeriodo && metodoOk && categoriaOk;
    });
    
    if (apenasParceladas) {
         despesasFiltradas = despesasFiltradas.filter(p => p.despesas?.qtd_parcelas > 1);
    }
    
    // Calcula as métricas
    const totalDespesas = despesasFiltradas.reduce((acc, p) => acc + (p.amount || 0), 0);
    const gastosPorDia = despesasFiltradas.reduce((acc, p) => {
        if(p.data_parcela) acc[p.data_parcela] = (acc[p.data_parcela] || 0) + (p.amount || 0);
        return acc;
    }, {});
    const diaMaisGastou = Object.entries(gastosPorDia).reduce(
        (maior, [dia, valor]) => (valor > maior.valor ? { dia, valor } : maior), { dia: 'N/A', valor: 0 }
    );

    // Retorna um objeto completo com os dados calculados
    return {
        startDate, endDate, totalDespesas, despesas: despesasFiltradas,
        diaMaisGastou, metodoPagamento, apenasParceladas, categoria,
    };
};