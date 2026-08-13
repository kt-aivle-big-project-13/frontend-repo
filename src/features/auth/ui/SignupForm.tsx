import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import PasswordField from '../../../shared/ui/PasswordField';
import '../../../shared/ui/authForm.css';
import {
  confirmVerificationCode,
  getApiErrorMessage,
  sendVerificationCode,
  signup,
} from '../api/signupApi';

import './SignupForm.css';

const PASSWORD_MAX_LENGTH = 16;

const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/;']/;

function countPasswordTypes(password: string): number {
  return [HAS_LETTER, HAS_DIGIT, HAS_SPECIAL].filter((pattern) =>
    pattern.test(password),
  ).length;
}

// 비밀번호 복잡도 검사
function isPasswordComplexEnough(password: string): boolean {
  const typeCount = countPasswordTypes(password);
  const { length } = password;

  if (typeCount >= 3) {
    return length >= 8 && length <= PASSWORD_MAX_LENGTH;
  }

  if (typeCount === 2) {
    return length >= 10 && length <= PASSWORD_MAX_LENGTH;
  }

  return false;
}

// 회원가입 폼 유효성 검사
const signupSchema = z
  .object({
    name: z
      .string()
      .trim() // 공백 제거
      .min(1, '이름을 입력해주세요.')
      .max(50, '이름은 50자 이하로 입력해주세요.'),
    
    institution: z
      .string()
      .trim()
      .min(1, '기업명을 입력해주세요.')
      .max(100, '기업명은 100자 이하로 입력해주세요.'),

    email: z
      .string()
      .trim()
      .min(1, '이메일을 입력해주세요.')
      .email('올바른 이메일 형식을 입력해주세요.')
      .max(100, '이메일은 100자 이하로 입력해주세요.'),
    
    password: z
      .string()
      .min(1, '비밀번호를 입력해주세요.')
      .refine(isPasswordComplexEnough, {
        message:
          '영문, 숫자, 특수문자 중 2종류 이상을 조합하여 10~16자리(3종류 이상 조합 시 8~16자리)로 구성할 수 있습니다.',
      }),
    
    passwordConfirm: z.string().min(1, '비밀번호를 다시 입력해주세요.'),
    
    agreeTerms: z.boolean().refine((value) => value, {
      message: '이용약관에 동의해주세요.',
    }),

    agreePrivacy: z.boolean().refine((value) => value, {
      message: '개인정보 수집 및 이용에 동의해주세요.',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

// zod 스키마 기반 회원가입 폼 타입 생성
type SignupFormValues = z.infer<typeof signupSchema>;

// 남은 초를 "M:SS" 형태로 표시
function formatRemainingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
    >
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignupForm() {
  const navigate = useNavigate();

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [sendCodeMessage, setSendCodeMessage] = useState('');
  const [sendCodeError, setSendCodeError] = useState('');

  const [verificationCode, setVerificationCode] = useState('');
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [confirmCodeMessage, setConfirmCodeMessage] = useState('');
  const [confirmCodeError, setConfirmCodeError] = useState('');

  // 인증번호 만료 시각(ms epoch). null이면 타이머 자체가 꺼진 상태(발송 전/인증 완료 후).
  // 카운트다운을 "1초마다 -1"로 세면 백그라운드 탭에서 setInterval이 지연될 때 실제
  // 서버 만료 시각보다 화면이 늦게 만료 처리되므로, 절대 시각을 기준으로 매 tick마다
  // 다시 계산한다.
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    null,
  );
  const isCodeExpired = remainingSeconds === 0;

  const [isTermsExpanded, setIsTermsExpanded] = useState(false);
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      institution: '',
      email: '',
      password: '',
      passwordConfirm: '',
      agreeTerms: false,
      agreePrivacy: false,
    },
    mode: 'onBlur',
  });

  const email = useWatch({ control, name: 'email' });
  const agreeTerms = useWatch({ control, name: 'agreeTerms' });
  const agreePrivacy = useWatch({ control, name: 'agreePrivacy' });
  const isAllAgreed = agreeTerms && agreePrivacy;

  const resetEmailVerification = () => {
    setIsCodeSent(false);
    setIsEmailVerified(false);
    setVerificationCode('');
    setSendCodeMessage('');
    setSendCodeError('');
    setConfirmCodeMessage('');
    setConfirmCodeError('');
    setExpiresAt(null);
    setRemainingSeconds(null);
  };

  // 인증번호가 발송된 동안(재발송 포함)에만 1초 단위로 남은 시간을 다시 계산한다.
  // expiresAt(절대 시각) 기준으로 매번 새로 계산하므로, 탭이 백그라운드에 있다가
  // 돌아와도 다음 tick에서 바로 정확한 값으로 보정된다.
  useEffect(() => {
    if (!isCodeSent || isEmailVerified || expiresAt === null) {
      return;
    }

    const tick = () => {
      setRemainingSeconds(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    };

    tick();
    const timerId = window.setInterval(tick, 1000);

    return () => window.clearInterval(timerId);
  }, [isCodeSent, isEmailVerified, expiresAt]);

  const handleSendCode = async () => {
    const emailResult = z.string().email().safeParse(email);

    if (!emailResult.success) {
      setSendCodeMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setIsSendingCode(true);
      setSendCodeMessage('');

      setSendCodeError(''); // 이전 오류 메시지 초기화

      const response = await sendVerificationCode({ email });

      setIsCodeSent(true);
      setSendCodeMessage(
        response.message ?? '인증번호가 발송되었습니다.',
      );
      setVerificationCode('');
      setConfirmCodeMessage('');
      setConfirmCodeError('');
      setExpiresAt(Date.now() + response.expiresIn * 1000);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        '인증번호 발송에 실패했습니다.',
      );

      setSendCodeError(errorMessage);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    if (isCodeExpired) {
      setConfirmCodeError('인증번호가 만료되었습니다. 다시 발송해주세요.');
      return;
    }

    if (!verificationCode) {
      setConfirmCodeError('인증번호를 입력해주세요.');
      return;
    }

    try {
      setIsConfirmingCode(true);
      setConfirmCodeMessage('');
      setConfirmCodeError('');

      const response = await confirmVerificationCode({
        email,
        code: verificationCode,
      });

      setIsEmailVerified(true);
      setConfirmCodeMessage(
        response.message ?? '인증이 완료되었습니다.',
      );
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        '인증번호가 일치하지 않거나 만료되었습니다.',
      );

      setConfirmCodeError(errorMessage);
    } finally {
      setIsConfirmingCode(false);
    }
  };

  const handleToggleAll = (checked: boolean) => {
    setValue('agreeTerms', checked, { shouldValidate: true });
    setValue('agreePrivacy', checked, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    setSubmitError('');
    setSuccessMessage('');

    if (!isEmailVerified) {
      setSubmitError('이메일 인증을 완료해주세요.');
      return;
    }

    try {
      const response = await signup({
        name: data.name,
        institution: data.institution,
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        serviceTermsAgreed: data.agreeTerms,
        privacyTermsAgreed: data.agreePrivacy,
      });

      setSuccessMessage(response.message ?? '회원가입이 완료되었습니다.');

      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error, '회원가입에 실패했습니다.'));
    }
  };

  return (
    <div className="auth-form">
      <header className="auth-form__header">
        <h2>회원가입</h2>
      </header>

      <form
        className="auth-form__body"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="auth-form__field">
          <label htmlFor="signup-name">이름</label>

          <input
            id="signup-name"
            type="text"
            placeholder="이름을 입력해주세요"
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />

          {errors.name?.message && (
            <p className="auth-form__field-error" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="auth-form__field">
          <label htmlFor="signup-institution-name">기업명</label>

          <input
            id="signup-institution-name"
            type="text"
            placeholder="소속 기업명을 입력해주세요"
            autoComplete="organization"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.institution)}
            {...register('institution')}
          />

          {errors.institution?.message && (
            <p className="auth-form__field-error" role="alert">
              {errors.institution.message}
            </p>
          )}
        </div>

        <div className="auth-form__field">
          <label htmlFor="signup-email">이메일 (사내 이메일 인증)</label>

          <div className="signup-form__inline">
            <input
              id="signup-email"
              type="email"
              placeholder="name@bank.co.kr"
              autoComplete="email"
              disabled={isSubmitting || isEmailVerified}
              aria-invalid={Boolean(errors.email)}
              {...register('email', { onChange: resetEmailVerification })}
            />

            <button
              type="button"
              className="signup-form__inline-button"
              onClick={handleSendCode}
              disabled={isSubmitting || isSendingCode || isEmailVerified}
            >
              {isSendingCode ? '발송 중' : '인증'}
            </button>
          </div>

          {errors.email?.message && (
            <p className="auth-form__field-error" role="alert">
              {errors.email.message}
            </p>
          )}

          {!errors.email && sendCodeMessage && (
            <p className="auth-form__hint">{sendCodeMessage}</p>
          )}

          {!errors.email && sendCodeError && (
            <p className="auth-form__field-error" role="alert">
              {sendCodeError}
            </p>
          )}
        </div>

        {isCodeSent && !isEmailVerified && (
          <div className="auth-form__field">
            <label htmlFor="signup-verification-code">인증번호</label>

            <div className="signup-form__inline">
              <input
                id="signup-verification-code"
                type="text"
                placeholder="인증번호 6자리"
                disabled={isSubmitting || isCodeExpired}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
              />

              <button
                type="button"
                className="signup-form__inline-button"
                onClick={handleConfirmCode}
                disabled={isSubmitting || isConfirmingCode || isCodeExpired}
              >
                {isConfirmingCode ? '확인 중' : '확인'}
              </button>
            </div>

            {remainingSeconds !== null && remainingSeconds > 0 && (
              <p className="signup-form__timer">
                남은 시간 {formatRemainingTime(remainingSeconds)}
              </p>
            )}

            {isCodeExpired && (
              <p className="auth-form__field-error" role="alert">
                인증번호가 만료되었습니다. &quot;인증&quot; 버튼을 눌러 다시
                발송해주세요.
              </p>
            )}

            {confirmCodeMessage && (
              <p className="auth-form__hint">{confirmCodeMessage}</p>
            )}

            {confirmCodeError && (
              <p className="auth-form__field-error" role="alert">
                {confirmCodeError}
              </p>
            )}
          </div>
        )}

        {isEmailVerified && (
          <p className="auth-form__message auth-form__message--success">
            이메일 인증이 완료되었습니다.
          </p>
        )}

        <div className="auth-form__field">
          <label htmlFor="signup-password">비밀번호</label>

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordField
                id="signup-password"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                autoComplete="new-password"
                disabled={isSubmitting}
                ariaInvalid={Boolean(errors.password)}
                ariaDescribedBy={
                  errors.password ? 'signup-password-error' : undefined
                }
              />
            )}
          />

          {errors.password?.message && (
            <p id="signup-password-error" className="auth-form__field-error" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="auth-form__field">
          <label htmlFor="signup-password-confirm">비밀번호 확인</label>

          <Controller
            name="passwordConfirm"
            control={control}
            render={({ field }) => (
              <PasswordField
                id="signup-password-confirm"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                autoComplete="new-password"
                disabled={isSubmitting}
                ariaInvalid={Boolean(errors.passwordConfirm)}
                ariaDescribedBy={
                  errors.passwordConfirm
                    ? 'signup-password-confirm-error'
                    : undefined
                }
              />
            )}
          />

          {errors.passwordConfirm?.message && (
            <p id="signup-password-confirm-error" className="auth-form__field-error" role="alert">
              {errors.passwordConfirm.message}
            </p>
          )}
        </div>

        <label className="signup-form__agree-all">
          <input
            type="checkbox"
            checked={isAllAgreed}
            onChange={(event) => handleToggleAll(event.target.checked)}
          />
          <span>약관에 모두 동의합니다.</span>
        </label>

        <div className="signup-form__terms">
          <div className="signup-form__term">
            <label className="signup-form__term-row">
              <input type="checkbox" {...register('agreeTerms')} />
              <span>[필수] 이용약관 동의</span>
            </label>

            <button
              type="button"
              className="signup-form__term-toggle"
              onClick={() => setIsTermsExpanded((prev) => !prev)}
              aria-label="이용약관 상세 보기"
            >
              <ChevronIcon expanded={isTermsExpanded} />
            </button>
          </div>

          {isTermsExpanded && (
            <div className="signup-form__term-detail">
              <table className="signup-form__table">
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>서비스</td>
                    <td>
                      AI 신용평가 규제준수 자동감사 플랫폼(FinAuditAI) 이용에
                      관한 약관
                    </td>
                  </tr>
                  <tr>
                    <td>회원 의무</td>
                    <td>허위정보 등록, 타인 정보 도용, 계정 공유 금지</td>
                  </tr>
                  <tr>
                    <td>서비스 이용</td>
                    <td>
                      역할(사용자/편집자/관리자)에 따라 이용 가능한 기능
                      범위가 다름
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="signup-form__table-note">
                ※ 전체 약관 전문은 하단 &quot;이용약관&quot; 링크에서
                확인하실 수 있습니다.
              </p>
            </div>
          )}

          <div className="signup-form__term">
            <label className="signup-form__term-row">
              <input type="checkbox" {...register('agreePrivacy')} />
              <span>[필수] 개인정보 수집 및 이용 동의</span>
            </label>

            <button
              type="button"
              className="signup-form__term-toggle"
              onClick={() => setIsPrivacyExpanded((prev) => !prev)}
              aria-label="개인정보 수집 및 이용 동의 상세 보기"
            >
              <ChevronIcon expanded={isPrivacyExpanded} />
            </button>
          </div>

          {isPrivacyExpanded && (
            <div className="signup-form__term-detail">
              <table className="signup-form__table">
                <thead>
                  <tr>
                    <th>목적</th>
                    <th>항목</th>
                    <th>보유기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>회원가입 및 서비스 제공</td>
                    <td>이름, 이메일, 비밀번호, 소속기관</td>
                    <td>회원 탈퇴 시까지</td>
                  </tr>
                </tbody>
              </table>

              <p className="signup-form__table-note">
                ※ 동의를 거부할 권리가 있으며, 거부 시 서비스 이용이 제한될 수
                있습니다.
              </p>
            </div>
          )}
        </div>

        {(errors.agreeTerms?.message || errors.agreePrivacy?.message) && (
          <p className="auth-form__field-error" role="alert">
            {errors.agreeTerms?.message ?? errors.agreePrivacy?.message}
          </p>
        )}

        <p className="signup-form__security-note">
          🔒 입력하신 비밀번호는 BCrypt 일방향 암호화되어 안전하게
          저장됩니다.
        </p>

        {submitError && (
          <div
            className="auth-form__message auth-form__message--error"
            role="alert"
          >
            {submitError}
          </div>
        )}

        {successMessage && (
          <div
            className="auth-form__message auth-form__message--success"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <button
          className="auth-form__submit"
          type="submit"
          disabled={isSubmitting || Boolean(successMessage)}
        >
          {isSubmitting ? '가입 중...' : '가입하기'}
        </button>

        <a className="auth-form__link" href="/login">
          이미 계정이 있으신가요? 로그인
        </a>
      </form>
    </div>
  );
}

export default SignupForm;