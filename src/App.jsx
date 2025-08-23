import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./pages/Dashboard";
import { DataProvider } from "./context/DataContext"; // 1. IMPORTAR O DATAPROVIDER

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    // 2. ENVOLVER O DASHBOARD COM O DATAPROVIDER
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
}

export default App;