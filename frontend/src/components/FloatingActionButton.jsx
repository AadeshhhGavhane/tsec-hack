import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick, label = 'Add Transaction' }) => {
  return (
    <button 
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40 flex items-center justify-center"
      onClick={onClick}
      aria-label={label}
    >
      <Plus size={24} />
    </button>
  );
};

export default FloatingActionButton;
