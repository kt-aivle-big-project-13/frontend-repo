interface AvatarProps {
  size?: number;
  className?: string;
}

// TODO: 프로필 이미지 업로드 기능 확정 전까지 기본 아이콘만 표시 (필요 없어지면 통째로 제거 가능)
function Avatar({ size = 36, className }: AvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="18" fill="#e3e7ee" />
      <circle cx="18" cy="14.5" r="6" fill="#aab2c0" />
      <path
        d="M6 30.5C6 24.7 11.4 21 18 21C24.6 21 30 24.7 30 30.5"
        fill="#aab2c0"
      />
    </svg>
  );
}

export default Avatar;
