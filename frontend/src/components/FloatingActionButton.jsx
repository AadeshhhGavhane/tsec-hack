import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick, label = 'Add Transaction' }) => {
  return (
    <button 
      className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-black font-bold brutal-border brutal-shadow brutal-shadow-hover animate-brutal-bounce transition-all duration-200 z-40 flex items-center justify-center"
      onClick={onClick}
      aria-label={label}
    >
      <Plus size={24} />
    </button>
  );
};

export default FloatingActionButton;
