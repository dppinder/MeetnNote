export interface TabDef<T extends string> {
  key: T;
  label: string;
  icon: string;
}

export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="segmented-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={tab.key === active ? "active" : ""}
          onClick={() => onChange(tab.key)}
        >
          <span className="material-symbols-outlined">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
