"use client";

import { useState } from "react";

type Task = {
  id: string;
  name: string;
  project: { name: string; color: string } | null;
};

export default function TaskCombobox({
  tasks,
  name = "task_id",
  defaultTaskId,
}: {
  tasks: Task[];
  name?: string;
  defaultTaskId?: string;
}) {
  const defaultTask = tasks.find((t) => t.id === defaultTaskId);
  const [inputValue, setInputValue] = useState(
    defaultTask
      ? (defaultTask.project ? `${defaultTask.project.name} / ` : "") + defaultTask.name
      : "",
  );
  const [selectedId, setSelectedId] = useState(defaultTaskId ?? "");

  const filtered = tasks.filter((t) => {
    const label = (t.project ? `${t.project.name} / ` : "") + t.name;
    return label.toLowerCase().includes(inputValue.toLowerCase());
  });

  const handleSelect = (t: Task) => {
    const label = (t.project ? `${t.project.name} / ` : "") + t.name;
    setInputValue(label);
    setSelectedId(t.id);
  };

  const showDropdown = inputValue.length > 0 && filtered.length > 0 && !selectedId;

  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        placeholder="Hledat task…"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setSelectedId("");
        }}
        autoComplete="off"
      />
      <input type="hidden" name={name} value={selectedId} />
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 16px rgba(15,23,42,0.1)",
            maxHeight: "14rem",
            overflowY: "auto",
          }}
        >
          {filtered.slice(0, 12).map((t) => (
            <button
              key={t.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(t);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                background: "none",
                border: "none",
                fontSize: "0.875rem",
              }}
            >
              {t.project && (
                <span
                  className="dot"
                  style={{ background: t.project.color, flexShrink: 0 }}
                />
              )}
              <span>
                {t.project && (
                  <span className="muted">{t.project.name} / </span>
                )}
                {t.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
