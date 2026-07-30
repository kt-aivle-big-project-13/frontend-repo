import { z } from 'zod';

export const objectionSchema = z.object({
  auditId: z
    .number({
      error: '연계할 감사를 선택해 주세요.',
    })
    .int()
    .positive('연계할 감사를 선택해 주세요.'),

  customerCaseNo: z
    .string()
    .trim()
    .min(1, '고객 심사 건 번호를 입력해 주세요.')
    .max(
      50,
      '고객 심사 건 번호는 50자 이하로 입력해 주세요.',
    ),

  reviewResult: z.enum(['APPROVED', 'REJECTED'], {
    error: '심사 결과를 선택해 주세요.',
  }),

  reviewBasis: z
    .string()
    .trim()
    .min(1, '담당자 판단 근거를 입력해 주세요.')
    .max(
      1000,
      '담당자 판단 근거는 1,000자 이하로 입력해 주세요.',
    ),
});

export type ObjectionFormValues = z.infer<
  typeof objectionSchema
>;