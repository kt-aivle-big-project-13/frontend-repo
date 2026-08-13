// 자가점검을 건너뛴 경우에만 프론트가 개선 권고 가이드·최종 보고서를 사전 생성한다.
// 제출한 경우는 백엔드가 자가점검 매핑 완료 시점에 같은 보고서를 만들지만
// (ReportPreGenerationService.preGenerateAfterSelfCheck), 건너뛰면 그 이벤트가 아예
// 발생하지 않아 선생성이 하나도 걸리지 않기 때문이다.
//
// 두 조건을 함께 보는 이유는 제출과 건너뛰기가 동시에 참일 수 있어서다. 자가점검을
// 제출한 뒤에도 건너뛰기를 체크할 수 있는데, 그 상태로 "결과 확인"을 누르면 백엔드가
// 이미 만든 보고서를 프론트가 한 번 더 만들게 된다.

interface ChecklistState {
  skipSelfCheck: boolean;
  isSelfCheckSubmitted: boolean;
}

export function shouldPregenerateSkippedReports({
  skipSelfCheck,
  isSelfCheckSubmitted,
}: ChecklistState): boolean {
  return skipSelfCheck && !isSelfCheckSubmitted;
}

// 제출을 마친 뒤에는 건너뛰기를 고를 수 없게 한다. 이미 낸 답변이 있는데 건너뛰기로
// 바꿀 이유가 없고, 바꿀 수 있게 두면 체크리스트 입력만 잠기면서 위의 중복 생성 경로가
// 열린다.
export function isSkipSelfCheckDisabled({
  isSelfCheckSubmitted,
}: Pick<ChecklistState, 'isSelfCheckSubmitted'>): boolean {
  return isSelfCheckSubmitted;
}
