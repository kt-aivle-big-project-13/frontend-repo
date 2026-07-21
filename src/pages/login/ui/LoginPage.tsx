import LoginForm from '../../../features/auth/ui/LoginForm';
import AuthLayout from '../../../widgets/auth-layout/ui/AuthLayout';

function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
