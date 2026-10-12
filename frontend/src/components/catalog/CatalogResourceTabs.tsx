import type { Resource } from "../../types/catalog.types";
import "../../styles/components/resource-tabs.css";
export function CatalogResourceTabs({ resources, selected, onSelect, label = "Catálogos", panelId, idPrefix }: {
  resources: Pick<Resource, "key" | "title">[]; selected: string; onSelect: (key: string) => void;
  label?: string; panelId?: string; idPrefix?: string;
}) {
  if (resources.length < 2) return null;
  return <div className="resource-tabs" role="tablist" aria-label={label}>
    {resources.map((resource) => <button type="button" role="tab" aria-selected={selected === resource.key}
      id={idPrefix ? `${idPrefix}-${resource.key}` : undefined} aria-controls={panelId}
      tabIndex={selected === resource.key ? 0 : -1}
      onKeyDown={event => {
        const index = resources.findIndex(item => item.key === resource.key);
        const next = event.key === "ArrowRight" ? (index + 1) % resources.length
          : event.key === "ArrowLeft" ? (index + resources.length - 1) % resources.length
          : event.key === "Home" ? 0 : event.key === "End" ? resources.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault(); onSelect(resources[next].key);
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button[role="tab"]')[next]?.focus();
      }}
      className={selected === resource.key ? "active" : ""} key={resource.key} onClick={() => onSelect(resource.key)}>
      {resource.title}
    </button>)}
  </div>;
}
