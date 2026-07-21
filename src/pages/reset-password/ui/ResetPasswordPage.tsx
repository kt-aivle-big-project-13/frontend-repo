import { useSearchParams } from 'react-router-dom';

import ResetPasswordForm from '../../../features/auth/ui/ResetPasswordForm';
import AuthLayout from '../../../widgets/auth-layout/ui/AuthLayout';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();

  const token =
    searchParams.get('token') ?? '';

  return (
    <AuthLayout>
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}

export default ResetPasswordPage;