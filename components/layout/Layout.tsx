'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import EditOrderBanner from './EditOrderBanner';
import DraftsDrawer from '@/components/drafts/DraftsDrawer';
import { useDrafts } from '@/context/DraftsContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const { openDrawer: openDraftsDrawer } = useDrafts();

  return (
    <div className="min-h-screen flex flex-col">
      <EditOrderBanner />
      <Header onCartClick={() => setCartOpen(true)} onDraftsClick={openDraftsDrawer} />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <DraftsDrawer />
    </div>
  );
}
