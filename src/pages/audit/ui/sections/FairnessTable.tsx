import { Popover } from 'antd';

import type { FairlearnResultItem } from '../../../../features/audit/api/auditApi';

import {
  ATTRIBUTE_LABEL,
  COLUMN_LABEL,
  COLUMN_ORDER,
  COLUMN_TOOLTIP,
  FAIRNESS_STATUS_LABEL,
  groupByAttribute,
} from './fairnessData';
import './FairnessTable.css';

interface FairnessTableProps {
  results: FairlearnResultItem[];
  isLoading: boolean;
  error: string | null;
}

function CriteriaHelpContent() {
  return (
    <div className="fairness-table__tooltip">
      <p className="fairness-table__tooltip-desc">
        지표 값이 기준 범위 안에 있으면 "충족", 조금 벗어나면 "추가검토", 크게 벗어나면
        "기준초과"로 표시돼요. 추가검토는 아직 확정된 문제가 아니라 사람이 한 번 더 살펴보면
        좋다는 신호예요.
      </p>
      <p className="fairness-table__tooltip-criteria">
        격차형 지표 (Demographic Parity · Equal Opportunity · Equalized Odds · FPR · FDR · FOR) —
        값이 0에 가까울수록 공정해요. 0.10 이하는 충족, 0.10~0.20은 추가검토, 0.20 초과는
        기준초과예요.
      </p>
      <p className="fairness-table__tooltip-criteria">
        비율형 지표 (Proportional Parity) — 값이 1에 가까울수록 공정해요. 0.80 이상은 충족,
        0.70~0.80은 추가검토, 0.70 미만은 기준초과예요.
      </p>
    </div>
  );
}

function FairnessTable({ results, isLoading, error }: FairnessTableProps) {
  const grouped = groupByAttribute(results);

  return (
    <section className="fairness-table">
      <div className="fairness-table__title-row">
        <h2 className="fairness-table__title">Fairlearn 공정성</h2>
        <Popover content={<CriteriaHelpContent />} title="판정 기준" trigger="click" placement="bottomLeft">
          <button type="button" className="fairness-table__help-button" aria-label="판정 기준 도움말">
            ?
          </button>
        </Popover>
      </div>

      {isLoading ? (
        <p className="fairness-table__status">불러오는 중…</p>
      ) : error ? (
        <p className="fairness-table__status fairness-table__status--error">{error}</p>
      ) : grouped.size === 0 ? (
        <p className="fairness-table__status">Fairlearn 감사 결과가 없습니다.</p>
      ) : (
        <div className="fairness-table__scroll">
          <table className="fairness-table__table">
            <thead>
              <tr>
                <th className="fairness-table__row-header-cell">민감변수</th>
                {COLUMN_ORDER.map((code) => (
                  <th key={code} className="fairness-table__col-header-cell">
                    <Popover
                      content={
                        <div className="fairness-table__tooltip">
                          <p className="fairness-table__tooltip-desc">
                            {COLUMN_TOOLTIP[code].description}
                          </p>
                          <p className="fairness-table__tooltip-tip">
                            <span aria-hidden="true">💡</span>
                            <span>{COLUMN_TOOLTIP[code].tip}</span>
                          </p>
                          <p className="fairness-table__tooltip-criteria">
                            {COLUMN_TOOLTIP[code].criteria}
                          </p>
                        </div>
                      }
                      title={COLUMN_TOOLTIP[code].title}
                      trigger="click"
                    >
                      <button type="button" className="fairness-table__col-header-button">
                        {COLUMN_LABEL[code]}
                      </button>
                    </Popover>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(grouped.entries()).map(([attribute, row]) => (
                <tr key={attribute}>
                  <td className="fairness-table__row-header-cell">
                    {ATTRIBUTE_LABEL[attribute] ?? attribute}
                  </td>
                  {COLUMN_ORDER.map((code) => {
                    const cell = row.get(code);

                    if (!cell) {
                      return (
                        <td key={code} className="fairness-table__cell">
                          <span className="fairness-table__cell-value">—</span>
                          <span className="fairness-table__badge fairness-table__badge--na">
                            계산불가
                          </span>
                          <span className="fairness-table__cell-note">표본 부족</span>
                        </td>
                      );
                    }

                    return (
                      <td key={code} className="fairness-table__cell">
                        <span className="fairness-table__cell-value">{cell.value}</span>
                        <span
                          className={`fairness-table__badge fairness-table__badge--${cell.status.toLowerCase()}`}
                        >
                          {FAIRNESS_STATUS_LABEL[cell.status]}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default FairnessTable;