import type { SelfCheckItemCode } from '../api/auditApi';

// 백엔드가 아직 21문항을 모른다(SelfCheckItemCode가 5개로 고정, NA 미지원). 문서 5장 역매핑
// 기준으로 신규 코드 중 기존 5문항과 질문이 완전히 동일한 5개만 옛 itemCode로 이어붙여서,
// 백엔드가 21문항을 지원하기 전까지도 이 5개만큼은 실제 저장·법조문 매칭이 그대로 동작하게 한다.
// 21문항 백엔드 연동(이슈 스코프 밖)이 끝나면 이 파일과 사용처를 통째로 제거하면 된다.
export const LEGACY_ITEM_CODE_MAP: Partial<Record<string, SelfCheckItemCode>> = {
  'TR-01': 'NOTICE',
  'UP-01': 'OBJECTION',
  'HO-01': 'OVERSIGHT',
  'RM-01': 'RISK_MANAGEMENT',
  'DC-01': 'DOCUMENTATION',
};

export const LEGACY_SUPPORTED_CODES = Object.keys(LEGACY_ITEM_CODE_MAP);

// 매칭 조항 패널이 백엔드가 내려준 옛 itemCode를 새 21문항 코드로 다시 보여줄 수 있도록 뒤집은 표.
export const REVERSE_LEGACY_ITEM_CODE_MAP: Partial<Record<SelfCheckItemCode, string>> =
  Object.fromEntries(
    Object.entries(LEGACY_ITEM_CODE_MAP).map(([newCode, legacyCode]) => [legacyCode, newCode]),
  );
