"use client";

export interface ListColumn {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "number";
}

interface ListTableProps<T extends Record<string, string>> {
  rows: T[];
  columns: ListColumn[];
  onChange: (rows: T[]) => void;
  addLabel: string;
}

export function ListTable<T extends Record<string, string>>({
  rows,
  columns,
  onChange,
  addLabel,
}: ListTableProps<T>) {
  const update = (i: number, key: string, value: string) => {
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  };

  const remove = (i: number) => {
    const next = rows.filter((_, j) => j !== i);
    if (next.length === 0) {
      const blank = Object.fromEntries(columns.map((c) => [c.key, ""])) as T;
      onChange([blank]);
    } else {
      onChange(next);
    }
  };

  const add = () => {
    const blank = Object.fromEntries(columns.map((c) => [c.key, ""])) as T;
    onChange([...rows, blank]);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-start gap-2 p-2 rounded-lg border border-border bg-surface"
        >
          <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_1fr]">
            {columns.map((c) =>
              c.type === "textarea" ? (
                <textarea
                  key={c.key}
                  value={row[c.key] ?? ""}
                  onChange={(e) => update(i, c.key, e.target.value)}
                  placeholder={c.placeholder}
                  rows={2}
                  className="ck-input resize-none !py-2 sm:col-span-1"
                />
              ) : (
                <input
                  key={c.key}
                  type={c.type ?? "text"}
                  value={row[c.key] ?? ""}
                  onChange={(e) => update(i, c.key, e.target.value)}
                  placeholder={c.placeholder}
                  className={`ck-input !py-2 ${
                    c.type === "number" ? "sm:max-w-[140px]" : ""
                  }`}
                />
              ),
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-text-tertiary hover:text-danger transition-colors shrink-0 mt-2"
            aria-label="Remove row"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
      >
        + {addLabel}
      </button>
    </div>
  );
}
