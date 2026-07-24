import type { ReactNode } from 'react';

import LoginPromptToast from '../../../entities/user/ui/LoginPromptToast';

import Footer from './Footer';
import Header from './Header';

import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout__content">{children}</main>
      <Footer />
      <LoginPromptToast />
    </div>
  );
}

export default MainLayout;
