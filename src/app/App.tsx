import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import FindPasswordPage from '../pages/find-password/ui/FindPasswordPage';
import ResetPasswordPage from '../pages/reset-password/ui/ResetPasswordPage';

import { QueryProvider } from './providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/find-password"
            element={<FindPasswordPage />}
          />

          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/find-password"
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