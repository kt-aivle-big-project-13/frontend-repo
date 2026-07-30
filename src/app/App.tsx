import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AuthInitializer from '../features/auth/model/AuthInitializer';
import AuditPage from '../pages/audit/ui/AuditPage';
import BoardDetailPage from '../pages/board/ui/BoardDetailPage';
import BoardFormPage from '../pages/board/ui/BoardFormPage';
import BoardListPage from '../pages/board/ui/BoardListPage';
import FindPasswordPage from '../pages/find-password/ui/FindPasswordPage';
import FeaturesPage from '../pages/features/ui/FeaturesPage';
import HomePage from '../pages/home/ui/HomePage';
import LoginPage from '../pages/login/ui/LoginPage';
import MyPage from '../pages/my-page/ui/MyPage';
import PreDiagnosisPage from '../pages/pre-diagnosis/ui/PreDiagnosisPage';
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
            <Route path="/" element={<HomePage />} />

            {/* 메인 기능 살펴보기 */}
            <Route path="/features" element={<FeaturesPage />} />

            {/* 고영향 AI 사전진단 */}
            <Route path="/pre-diagnosis" element={<PreDiagnosisPage />} />

            {/* 모델 감사 실행 — STEP2 모델 업로드 */}
            <Route path="/audit" element={<AuditPage mode="upload" />} />
            {/* STEP3 체크리스트 작성 (분석 진행 상황 확인 + 자가점검 동시 진행) */}
            <Route
              path="/audit/:auditId"
              element={<AuditPage mode="checklist" />}
            />
            {/* STEP4 결과물 및 보고서 다운로드 */}
            <Route
              path="/audit/:auditId/results"
              element={<AuditPage mode="results" />}
            />

            {/* 게시판 */}
            <Route path="/board" element={<BoardListPage />} />
            <Route path="/board/write" element={<BoardFormPage />} />
            <Route path="/board/:postId" element={<BoardDetailPage />} />
            <Route path="/board/:postId/edit" element={<BoardFormPage />} />

            {/* 비밀번호 찾기 */}
            <Route path="/find-password" element={<FindPasswordPage />} />

            {/* 새 비밀번호 설정 */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* 로그인 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 회원가입 */}
            <Route path="/signup" element={<SignupPage />} />

            {/* 마이페이지 */}
            <Route path="/my-page" element={<MyPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthInitializer>
    </QueryProvider>
  );
}

export default App;