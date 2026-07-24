import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AuthInitializer from '../features/auth/model/AuthInitializer';
import AuditPage from '../pages/audit/ui/AuditPage';
import FindPasswordPage from '../pages/find-password/ui/FindPasswordPage';
import FeaturesPage from '../pages/features/ui/FeaturesPage';
import HomePage from '../pages/home/ui/HomePage';
import LoginPage from '../pages/login/ui/LoginPage';
import MyPage from '../pages/my-page/ui/MyPage';
import ResetPasswordPage from '../pages/reset-password/ui/ResetPasswordPage';
import SignupPage from '../pages/signup/ui/SignupPage';
import { QueryProvider } from './providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <AuthInitializer>
        <BrowserRouter>
          <Routes>
            {/* 메인 */}
            <Route
              path="/"
              element={<HomePage />}
            />

            {/* 메인 기능 살펴보기 */}
            <Route
              path="/features"
              element={<FeaturesPage />}
            />

            {/* 비밀번호 찾기 */}
            <Route
              path="/find-password"
              element={<FindPasswordPage />}
            />

            {/* 새 비밀번호 설정 */}
            <Route
              path="/reset-password"
              element={<ResetPasswordPage />}
            />

            {/* 로그인 */}
            <Route
              path="/login"
              element={<LoginPage />}
            />

            {/* 회원가입 */}
            <Route
              path="/signup"
              element={<SignupPage />}
            />

            {/* 감사 */}
            <Route
              path="/audit"
              element={<AuditPage />}
            />

            {/* 마이페이지 */}
            <Route
              path="/my-page"
              element={<MyPage />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthInitializer>
    </QueryProvider>
  );
}

export default App;
