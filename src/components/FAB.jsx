// src/components/FAB.jsx
export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 bg-purple-700 text-white p-4 rounded-full shadow-lg hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 transition-transform duration-200 ease-in-out hover:scale-110 z-30"
      aria-label="Adicionar nova despesa"
      title="Adicionar nova despesa"
    >
      <span className="material-symbols-outlined">add</span>
    </button>
  );
}