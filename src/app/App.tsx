import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AdminPage from '../pages/admin/ui/AdminPage';
import FindPasswordPage from '../pages/find-password/ui/FindPasswordPage';
import FeaturesPage from '../pages/features/ui/FeaturesPage';
import HomePage from '../pages/home/ui/HomePage';
import ResetPasswordPage from '../pages/reset-password/ui/ResetPasswordPage';
import LoginPage from '../pages/login/ui/LoginPage';
import SignupPage from '../pages/signup/ui/SignupPage';
import { QueryProvider } from './providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
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

          {/* 관리자 권한 */}
          <Route
            path="/admin"
            element={<AdminPage />}
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
    </QueryProvider>
  );
}

export default App;