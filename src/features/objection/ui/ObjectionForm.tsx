import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Radio, Select } from 'antd';
import { Controller, useForm } from 'react-hook-form';

import type { AuditSummary } from '../../audit/api/auditApi';
import {
  objectionSchema,
  type ObjectionFormValues,
} from '../model/objectionSchema';

interface ObjectionFormProps {
  audits: AuditSummary[];
  isLoadingAudits: boolean;
  isSubmitting: boolean;
  onSubmit: (
    values: ObjectionFormValues,
  ) => Promise<void>;
}

function ObjectionForm({
  audits,
  isLoadingAudits,
  isSubmitting,
  onSubmit,
}: ObjectionFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ObjectionFormValues>({
    resolver: zodResolver(objectionSchema),
    defaultValues: {
      customerCaseNo: '',
      reviewResult: 'REJECTED',
      reviewBasis: '',
    },
  });

  const auditOptions = audits
    .filter(
      (audit) =>
        audit.status !== 'PENDING' &&
        audit.status !== 'IN_PROGRESS',
    )
    .map((audit) => ({
      value: audit.auditId,
      label: `${audit.modelName} · 감사 #${audit.auditId}`,
    }));

  return (
    <form
      className="objection-form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="objection-form__field">
        <label
          className="objection-form__label"
          htmlFor="auditId"
        >
          연계 감사 <span>*</span>
        </label>

        <Controller
          control={control}
          name="auditId"
          render={({ field }) => (
            <Select
              id="auditId"
              className="objection-form__control"
              loading={isLoadingAudits}
              options={auditOptions}
              placeholder="이의제기와 연계할 감사를 선택해 주세요."
              value={field.value}
              onBlur={field.onBlur}
              onChange={field.onChange}
              notFoundContent={
                isLoadingAudits
                  ? '감사 목록을 불러오는 중입니다.'
                  : '연계 가능한 감사 결과가 없습니다.'
              }
            />
          )}
        />

        {errors.auditId && (
          <p className="objection-form__error">
            {errors.auditId.message}
          </p>
        )}
      </div>

      <div className="objection-form__field">
        <label
          className="objection-form__label"
          htmlFor="customerCaseNo"
        >
          고객 심사 건 번호 <span>*</span>
        </label>

        <Controller
          control={control}
          name="customerCaseNo"
          render={({ field }) => (
            <Input
              {...field}
              id="customerCaseNo"
              className="objection-form__control"
              placeholder="예: C-2026-0712"
              maxLength={50}
            />
          )}
        />

        {errors.customerCaseNo && (
          <p className="objection-form__error">
            {errors.customerCaseNo.message}
          </p>
        )}
      </div>

      <div className="objection-form__field">
        <span className="objection-form__label">
          심사 결과 <span>*</span>
        </span>

        <Controller
          control={control}
          name="reviewResult"
          render={({ field }) => (
            <Radio.Group
              className="objection-form__result-group"
              value={field.value}
              onChange={(event) =>
                field.onChange(event.target.value)
              }
            >
              <Radio.Button value="REJECTED">
                거절 유지
              </Radio.Button>

              <Radio.Button value="APPROVED">
                재심사 승인
              </Radio.Button>
            </Radio.Group>
          )}
        />

        {errors.reviewResult && (
          <p className="objection-form__error">
            {errors.reviewResult.message}
          </p>
        )}
      </div>

      <div className="objection-form__field">
        <label
          className="objection-form__label"
          htmlFor="reviewBasis"
        >
          담당자 판단 근거 <span>*</span>
        </label>

        <Controller
          control={control}
          name="reviewBasis"
          render={({ field }) => (
            <Input.TextArea
              {...field}
              id="reviewBasis"
              className="objection-form__basis"
              placeholder="심사 결과를 유지하거나 변경한 판단 근거를 입력해 주세요."
              maxLength={1000}
              showCount
            />
          )}
        />

        {errors.reviewBasis && (
          <p className="objection-form__error">
            {errors.reviewBasis.message}
          </p>
        )}
      </div>

      <Button
        className="objection-form__submit"
        htmlType="submit"
        type="primary"
        loading={isSubmitting}
        disabled={isLoadingAudits}
      >
        이의제기 등록 및 설명문 생성
      </Button>
    </form>
  );
}

export default ObjectionForm;