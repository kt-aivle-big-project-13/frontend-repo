import type { ReactNode } from 'react';

import { useAuthStore } from '../../../entities/user/model/authStore';
import LoginPromptToast from '../../../entities/user/ui/LoginPromptToast';
import ChatbotWidget from '../../chatbot/ui/ChatbotWidget';

import Footer from './Footer';
import Header from './Header';

import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const chatbotSessionKey = useAuthStore((state) =>
    state.accessToken && state.user
      ? `authenticated-${state.user.id}`
      : 'unauthenticated',
  );

  return (
    <div className="main-layout">
      <Header />

      <main className="main-layout__content">
        {children}
      </main>

      <Footer />
      <LoginPromptToast />
      <ChatbotWidget key={chatbotSessionKey} />
    </div>
  );
}

export default MainLayout;