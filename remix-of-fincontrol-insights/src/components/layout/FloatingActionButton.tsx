import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
      aria-label="Add new transaction"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};

export default FloatingActionButton;
