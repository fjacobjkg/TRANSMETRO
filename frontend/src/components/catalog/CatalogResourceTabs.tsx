import type { Resource } from "../../types/catalog.types";
export function CatalogResourceTabs({ resources, selected, onSelect }: {
  resources: Resource[]; selected: string; onSelect: (key: string) => void;
}) {
  if (resources.length < 2) return null;
  return <div className="resource-tabs" role="tablist" aria-label="Catálogos">
    {resources.map((resource) => <button type="button" role="tab" aria-selected={selected === resource.key}
      className={selected === resource.key ? "active" : ""} key={resource.key} onClick={() => onSelect(resource.key)}>
      {resource.title}
    </button>)}
  </div>;
}
