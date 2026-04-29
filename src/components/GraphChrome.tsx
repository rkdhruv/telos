import type { ReactNode } from "react";
import type { TooltipProps } from "recharts";

interface CardProps {
  children: ReactNode;
  toolbar?: ReactNode;
}

export function GraphCard({ children, toolbar }: CardProps) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-6">
      {toolbar && <div className="mb-4 flex items-center justify-end">{toolbar}</div>}
      {children}
    </div>
  );
}

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleProps<T extends string> {
  value: T;
  options: ToggleOption<T>[];
  onChange: (next: T) => void;
}

export function ProjectionToggle<T extends string>({
  value,
  options,
  onChange,
}: ToggleProps<T>) {
  return (
    <div className="flex items-center gap-1 rounded-sm border border-border p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "rounded-sm px-2.5 py-1 text-xs transition-colors duration-300 ease-soft " +
              (active
                ? "bg-accent-soft text-text-primary"
                : "text-text-tertiary hover:text-text-secondary")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface TooltipExtra {
  unit?: string;
}

export function GraphTooltip({
  active,
  payload,
  label,
  unit,
}: TooltipProps<number, string> & TooltipExtra) {
  if (!active || !payload || payload.length === 0) return null;

  const reality = payload.find((p) => p.dataKey === "reality")?.value;
  const expected = payload.find((p) => p.dataKey === "expected")?.value;
  const delta =
    typeof reality === "number" && typeof expected === "number"
      ? reality - expected
      : null;

  return (
    <div className="rounded border border-border bg-bg-elevated px-3 py-2">
      <p className="font-display italic text-xs text-text-tertiary">{label}</p>
      <p className="mt-1 font-display text-sm text-text-primary">
        {typeof reality === "number" ? reality.toFixed(reality % 1 === 0 ? 0 : 1) : "—"}
        {unit ? ` ${unit}` : ""}
      </p>
      {delta !== null && (
        <p className="mt-0.5 text-xs text-text-tertiary">
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} vs expected
        </p>
      )}
    </div>
  );
}
