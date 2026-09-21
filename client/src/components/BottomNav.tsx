export type AppPage = "meeting" | "library" | "tasks";

export function BottomNav({
  page,
  onNavigate,
  onRecord,
}: {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  onRecord: () => void;
}) {
  return (
    <nav className="bottom-nav">
      <button
        className={page === "meeting" ? "active" : ""}
        onClick={() => onNavigate("meeting")}
        aria-label="Notes"
      >
        <span className="material-symbols-outlined">description</span>
        <span>Notes</span>
      </button>
      <button onClick={onRecord} aria-label="New recording">
        <span className="material-symbols-outlined">graphic_eq</span>
        <span>Record</span>
      </button>
      <button
        className={page === "tasks" ? "active" : ""}
        onClick={() => onNavigate("tasks")}
        aria-label="Tasks"
      >
        <span className="material-symbols-outlined">check_circle</span>
        <span>Tasks</span>
      </button>
      <button
        className={page === "library" ? "active" : ""}
        onClick={() => onNavigate("library")}
        aria-label="Library"
      >
        <span className="material-symbols-outlined">folder</span>
        <span>Library</span>
      </button>
    </nav>
  );
}
