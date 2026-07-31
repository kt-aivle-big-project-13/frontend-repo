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

function FairnessTable({ results, isLoading, error }: FairnessTableProps) {
  const grouped = groupByAttribute(results);

  return (
    <section className="fairness-table">
      <h2 className="fairness-table__title">Fairlearn 공정성</h2>
      <p className="fairness-table__desc">
        감사 대상 민감변수 2개 · 변수별 7개 지표 (
        {COLUMN_ORDER.map((code) => COLUMN_LABEL[code]).join(' · ')})
      </p>

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

      <div className="fairness-table__legend">
        <p className="fairness-table__legend-title">판정 기준</p>
        <p className="fairness-table__legend-row">
          격차형 지표 (DP·EO·EOdds·FPR·FDR·FOR) — PASS ≤0.10 · REVIEW 0.10~0.20 · FAIL &gt;0.20
        </p>
        <p className="fairness-table__legend-row">
          비율형 지표 (Proportional Parity) — PASS ≥0.80 · REVIEW 0.70~0.80 · FAIL &lt;0.70
        </p>
      </div>
    </section>
  );
}

export default FairnessTable;
