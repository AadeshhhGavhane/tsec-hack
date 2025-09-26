import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick, label = 'Add Transaction' }) => {
  return (
    <button 
      className="fab"
      onClick={onClick}
      aria-label={label}
    >
      <Plus size={24} />
    </button>
  );
};

export default FloatingActionButton;
