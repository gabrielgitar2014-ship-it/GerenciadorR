import { useState } from "react";

export default function LoginScreen({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // RASTREADOR: Confirma que o clique no botão foi registrado e a função handleSubmit começou.
    console.log("[LoginScreen] Botão 'Entrar' clicado. Iniciando processo de login...");

    setIsLoading(true);
    setError("");

    // Simula um pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsLoading(false);
    
    // RASTREADOR: Confirma que a função para mudar de tela está prestes a ser chamada.
    console.log("[LoginScreen] Login considerado bem-sucedido. Chamando onLoginSuccess para mudar para o Dashboard...");
    
    // Verificação de segurança para garantir que onLoginSuccess é uma função
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess();
    } else {
      console.error("[LoginScreen] ERRO CRÍTICO: onLoginSuccess não é uma função! Verifique a prop passada pelo App.jsx.");
      setError("Erro de configuração. Não é possível fazer login.");
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background-login.png')" }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <form
            onSubmit={handleSubmit}
            className="bg-blue-600 shadow-2xl rounded-xl px-8 pt-6 pb-8"
          >
            <div className="flex items-center justify-center bg-blue-700 p-3 rounded-lg mb-8">
              <span className="material-symbols-outlined text-white mr-3">
                person
              </span>
              <span className="text-xl font-medium text-white">Casa</span>
            </div>
            {error && (
              <p className="text-yellow-300 text-center text-sm mb-4">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-200 text-blue-600 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}