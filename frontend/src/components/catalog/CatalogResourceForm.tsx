import {
  useState,
  type FormEvent,
} from "react";

import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { FieldLabel } from "../ui/FieldLabel";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Notice } from "../ui/PageHeader";

import {
  optionLabel,
  relations,
} from "../../config/catalog/relations";

import type {
  Field,
  Resource,
} from "../../types/catalog.types";

import type {
  Row,
} from "../ui/DataTable";


export function CatalogResourceForm({
  resource,
  fields,
  values,
  lookups,
  error,
  busy,
  editing,
  onChange,
  onSubmit,
  onClose,
}: {
  resource: Resource;
  fields: Field[];
  values: Record<string, string>;
  lookups: Record<string, Row[]>;
  error: string;
  busy: boolean;
  editing: Row | null;

  onChange: (
    name: string,
    value: string,
  ) => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;

  onClose: () => void;
}) {
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  /* ========================================
     CONTROL DE CAMPOS
  ======================================== */

  function control(field: Field) {
    const value =
      values[field.name] ?? "";

    const relation =
      relations[field.name];


    /* ======================================
       RELACIONES
    ====================================== */

    if (relation) {
      return (
        <Select
          required={field.required}
          value={value}
          onChange={(event) =>
            onChange(
              field.name,
              event.target.value,
            )
          }
          placeholder={
            "Selecciona " +
            relation.label.toLowerCase()
          }
        >
          {resource.key === "assign-line" &&
            field.name === "lineId" && (
              <option value="0">
                Retirar de la línea
              </option>
            )}


          {(lookups[field.name] ?? []).map(
            (row) => (
              <option
                key={String(
                  row[relation.id],
                )}
                value={String(
                  row[relation.id],
                )}
              >
                {optionLabel(row)}

                {row.activo === false
                  ? " · En preparación / inactivo"
                  : ""}
              </option>
            ),
          )}
        </Select>
      );
    }


    /* ======================================
       SELECT
    ====================================== */

    if (field.kind === "select") {
      return (
        <Select
          required={field.required}
          value={value}
          onChange={(event) =>
            onChange(
              field.name,
              event.target.value,
            )
          }
          placeholder="Selecciona una opción"
        >
          {field.options
            ?.filter(
              (item) =>
                item.value !== "",
            )
            .map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
        </Select>
      );
    }


    /* ======================================
       TEXTAREA
    ====================================== */

    if (field.kind === "textarea") {
      return (
        <textarea
          rows={3}
          required={field.required}
          value={value}
          onChange={(event) =>
            onChange(
              field.name,
              event.target.value,
            )
          }
        />
      );
    }


    /* ======================================
       PASSWORD
    ====================================== */

    if (field.kind === "password") {
      return (
        <div className="catalog-password-field">

          <Input
            type={
              showPassword
                ? "text"
                : "password"
            }
            minLength={field.minLength}
            required={field.required}
            value={value}
            autoComplete="new-password"
            onChange={(event) =>
              onChange(
                field.name,
                event.target.value,
              )
            }
          />


          <button
            type="button"
            className="catalog-password-toggle"
            aria-label={
              showPassword
                ? "Ocultar contraseña"
                : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            onClick={() =>
              setShowPassword(
                (current) => !current,
              )
            }
          >
            {showPassword
              ? "Ocultar"
              : "Mostrar"}
          </button>

        </div>
      );
    }


    /* ======================================
       INPUT GENERAL
    ====================================== */

    return (
      <Input
        type={
          field.kind ?? "text"
        }
        min={field.min}
        minLength={field.minLength}
        step={
          field.kind === "number"
            ? "1"
            : undefined
        }
        required={field.required}
        value={value}
        onChange={(event) =>
          onChange(
            field.name,
            event.target.value,
          )
        }
      />
    );
  }


  /* ========================================
     RENDER
  ======================================== */

  return (
    <Dialog
      title={
        `${editing ? "Editar" : "Configurar"} · ${resource.title}`
      }
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>

        {/* ERROR */}
        <Notice
          error={error}
        />


        {/* DESCRIPCIÓN */}
        <p className="muted">
          {resource.description}
        </p>


        {/* CAMPOS */}
        <div className="catalog-form-grid">

          {fields.map((field) => (
            <label
              key={field.name}
            >
              <FieldLabel
                required={field.required}
              >
                {relations[field.name]?.label ??
                  field.label}
              </FieldLabel>


              {control(field)}
            </label>
          ))}

        </div>


        {/* AYUDA DE CONTRASEÑA */}
        {resource.key === "users" && (
          <p className="muted catalog-password-help">
            La contraseña necesita 12 caracteres
            como mínimo, con mayúscula, minúscula
            y número.
          </p>
        )}


        {/* ACCIONES */}
        <div className="form-footer">

          <Button
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </Button>


          <Button
            variant="primary"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Guardando…"
              : "Guardar cambios"}
          </Button>

        </div>

      </form>
    </Dialog>
  );
}