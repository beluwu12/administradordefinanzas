import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import FloatingActionButton from './FloatingActionButton';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TransactionForm from '@/components/features/TransactionForm';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar className="flex w-full border-none" />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="container max-w-7xl px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Mobile FAB */}
      <FloatingActionButton onClick={() => setTransactionDialogOpen(true)} />

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSuccess={() => setTransactionDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainLayout;
