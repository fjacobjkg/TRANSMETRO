import { useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { filterSelectOptions, initialSelectState, nextSelectIndex, searchableSelectReducer, SELECT_MAX_HEIGHT,
  type SearchableOption } from "../../utils/searchable-select";
import "../../styles/components/searchable-select.css";

export type { SearchableOption } from "../../utils/searchable-select";
type Props = {
  value: string; options: SearchableOption[]; onChange: (value: string) => void;
  placeholder?: string; disabled?: boolean; required?: boolean; id?: string; name?: string;
  "aria-label"?: string; "aria-describedby"?: string;
};

export function SearchableSelect({ value, options, onChange, placeholder = "Selecciona una opción", disabled = false,
  required = false, id, name, "aria-label": ariaLabel, "aria-describedby": describedBy }: Props) {
  const generatedId = useId();
  const inputId = id ?? `select-${generatedId}`;
  const listId = `${inputId}-options`;
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLSpanElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(searchableSelectReducer, initialSelectState);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const selected = options.find(option => option.value === value);
  const choices = useMemo(() => required || options.some(option => option.value === "") ? options
    : [{ value: "", label: placeholder }, ...options], [options, placeholder, required]);
  const filtered = useMemo(() => filterSelectOptions(choices, state.query), [choices, state.query]);
  const open = state.open && !disabled;
  const active = filtered[state.active] && !filtered[state.active].disabled ? state.active : nextSelectIndex(filtered, -1, 1);
  const close = () => dispatch({ type: "close" });

  function openList(direction: 1 | -1 = 1) {
    const selectedIndex = choices.findIndex(option => option.value === value && !option.disabled);
    dispatch({ type: "open", active: selectedIndex >= 0 ? selectedIndex
      : nextSelectIndex(choices, direction === 1 ? -1 : 0, direction) });
  }
  function choose(option: SearchableOption) {
    if (disabled || option.disabled) return;
    onChange(option.value); close(); input.current?.focus({ preventScroll: true });
  }
  function keyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      if (!open) openList(direction);
      else dispatch({ type: "move", active: nextSelectIndex(filtered, active, direction) });
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault(); event.stopPropagation(); close();
    } else if (event.key === "Tab") close();
  }

  useEffect(() => {
    input.current?.setCustomValidity(required && !disabled && (!value || !selected || selected.disabled)
      ? "Selecciona una opción de la lista." : "");
  }, [required, disabled, value, selected]);
  useEffect(() => { if (disabled) dispatch({ type: "close" }); }, [disabled]);
  useLayoutEffect(() => {
    if (!open || !input.current) return;
    // Keep the popup inside a modal's top layer, while escaping scrollable form containers.
    setPortalRoot(input.current.closest("dialog") ?? document.body);
    function place() {
      const rect = input.current!.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < SELECT_MAX_HEIGHT && above > below;
      setPosition({ position: "fixed", left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
        width: Math.min(rect.width, window.innerWidth - 16),
        ...(upwards ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        maxHeight: Math.max(40, Math.min(SELECT_MAX_HEIGHT, upwards ? above : below)) });
    }
    function scrolling(event: Event) { if (!popup.current?.contains(event.target as Node)) place(); }
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !popup.current?.contains(target)) dispatch({ type: "close" });
    }
    place(); window.addEventListener("resize", place); window.addEventListener("scroll", scrolling, true);
    document.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", scrolling, true);
      document.removeEventListener("pointerdown", outside); };
  }, [open]);
  useEffect(() => {
    if (open) popup.current?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, state.query, position]);

  return <span className="searchable-select" ref={root}>
    <input id={inputId} ref={input} className="searchable-select-input" type="text" role="combobox" autoComplete="off"
      aria-label={ariaLabel} aria-describedby={describedBy} aria-autocomplete="list" aria-haspopup="listbox"
      aria-expanded={open} aria-controls={open ? listId : undefined}
      aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
      value={open ? state.query : selected?.label ?? ""} placeholder={open ? "Buscar…" : placeholder}
      required={required} disabled={disabled} onClick={() => { if (!open) openList(); }} onKeyDown={keyboard}
      onBlur={event => { if (!popup.current?.contains(event.relatedTarget)) close(); }}
      onChange={event => {
        const query = event.target.value;
        dispatch({ type: "search", query, active: nextSelectIndex(filterSelectOptions(choices, query), -1, 1) });
      }} />
    <ChevronDown className="searchable-select-chevron" size={16} aria-hidden="true" />
    {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
    {open && portalRoot && position && createPortal(<div id={listId} ref={popup} role="listbox" aria-label={ariaLabel ?? placeholder}
      className="searchable-select-options" style={position}>
      {!filtered.length && <div className="searchable-select-empty" role="status">Sin resultados</div>}
      {filtered.map((option, index) => <div key={option.value} id={`${listId}-${index}`} role="option" tabIndex={-1}
        aria-selected={option.value === value} aria-disabled={option.disabled || undefined} data-option-index={index}
        className={`searchable-select-option${active === index ? " is-highlighted" : ""}`}
        onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}
        onMouseMove={() => { if (!option.disabled && active !== index) dispatch({ type: "move", active: index }); }}>
        {option.label}
      </div>)}
    </div>, portalRoot)}
  </span>;
}
