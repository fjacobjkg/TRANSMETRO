export type SearchableOption = { value: string; label: string; disabled?: boolean };
export const SELECT_MAX_HEIGHT = 280;
const normalized = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function filterSelectOptions(options: SearchableOption[], query: string): SearchableOption[] {
  const search = normalized(query.trim());
  return options.filter(option => normalized(option.label).includes(search));
}

export function nextSelectIndex(options: SearchableOption[], current: number, direction: 1 | -1): number {
  if (!options.length) return -1;
  const start = current >= 0 && current < options.length ? current : direction === 1 ? -1 : 0;
  for (let offset = 1; offset <= options.length; offset++) {
    const index = (start + direction * offset + options.length * 2) % options.length;
    if (!options[index].disabled) return index;
  }
  return -1;
}

export type SelectState = { open: boolean; query: string; active: number };
export const initialSelectState: SelectState = { open: false, query: "", active: -1 };
export function searchableSelectReducer(state: SelectState, action:
  | { type: "open"; active: number } | { type: "search"; query: string; active: number }
  | { type: "move"; active: number } | { type: "close" }): SelectState {
  if (action.type === "close") return initialSelectState;
  if (action.type === "open") return { open: true, query: "", active: action.active };
  if (action.type === "search") return { open: true, query: action.query, active: action.active };
  return { ...state, active: action.active };
}
