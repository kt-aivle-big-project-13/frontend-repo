import { useId } from 'react';

interface MetricHelpTooltipProps {
  label: string;
  description: string;
  tip: string;
}

function MetricHelpTooltip({ label, description, tip }: MetricHelpTooltipProps) {
  const tooltipId = useId();

  return (
    <span className="metric-help-tooltip">
      <button
        type="button"
        className="metric-help-tooltip__trigger"
        aria-label={`${label} 도움말`}
        aria-describedby={tooltipId}
      >
        <span className="metric-help-tooltip__trigger-mark" aria-hidden="true">
          ?
        </span>
      </button>

      <span id={tooltipId} className="metric-help-tooltip__content" role="tooltip">
        <strong className="metric-help-tooltip__title">
          <span className="metric-help-tooltip__info-icon" aria-hidden="true">
            i
          </span>
          <span>{label}</span>
        </strong>

        <span className="metric-help-tooltip__description">{description}</span>

        <span className="metric-help-tooltip__tip">
          <span className="metric-help-tooltip__tip-icon" aria-hidden="true">
            💡
          </span>
          <span>{tip}</span>
        </span>
      </span>
    </span>
  );
}

export default MetricHelpTooltip;
