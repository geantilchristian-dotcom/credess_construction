"use client";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  supabase,
} from "@/lib/supabase";
import styles from
  "./AdminCrud.module.css";
export type AdminField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "textarea"
    | "boolean"
    | "select"
    | "json";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};
type Props = {
  table: string;
  title: string;
  description?: string;
  fields: AdminField[];
  orderBy?: string;
  publishField?: string;
  fixedValues?: Record<
    string,
    any
  >;
};
export default function AdminCrud({
  table,
  title,
  description,
  fields,
  orderBy = "sort_order",
  publishField,
  fixedValues = {},
}: Props) {
  const [
    rows,
    setRows,
  ] =
    useState<any[]>([]);
  const [
    loading,
    setLoading,
  ] =
    useState(true);
  const [
    saving,
    setSaving,
  ] =
    useState(false);
  const [
    editingId,
    setEditingId,
  ] =
    useState<string | null>(
      null
    );
  const [
    form,
    setForm,
  ] =
    useState<
      Record<string, any>
    >({});
  const [
    error,
    setError,
  ] =
    useState("");
  function emptyForm() {
    const result:
      Record<string, any> =
      {};
    fields.forEach(
      (field) => {
        if (
          field.type ===
          "boolean"
        ) {
          result[
            field.name
          ] = true;
        }
        else {
          result[
            field.name
          ] = "";
        }
      }
    );
    return {
      ...result,
      ...fixedValues,
    };
  }
  async function loadRows() {
    setLoading(true);
    setError("");
    let query =
      supabase
        .from(table)
        .select("*");
    Object.entries(
      fixedValues
    ).forEach(
      ([
        key,
        value,
      ]) => {
        query =
          query.eq(
            key,
            value
          );
      }
    );
    const {
      data,
      error:
        loadError,
    } =
      await query.order(
        orderBy,
        {
          ascending:
            true,
        }
      );
    if (loadError) {
      setError(
        loadError.message
      );
      setRows([]);
    }
    else {
      setRows(
        data ?? []
      );
    }
    setLoading(false);
  }
  useEffect(() => {
    setForm(
      emptyForm()
    );
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    table,
  ]);
  function updateField(
    name: string,
    value: any
  ) {
    setForm(
      (current) => ({
        ...current,
        [name]:
          value,
      })
    );
  }
  function startEdit(
    row: any
  ) {
    const data:
      Record<string, any> =
      {
        ...fixedValues,
      };
    fields.forEach(
      (field) => {
        const value =
          row[
            field.name
          ];
        if (
          field.type ===
          "json"
        ) {
          data[
            field.name
          ] =
            JSON.stringify(
              value ?? [],
              null,
              2
            );
        }
        else {
          data[
            field.name
          ] =
            value ?? "";
        }
      }
    );
    setEditingId(
      row.id
    );
    setForm(
      data
    );
    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }
  function cancelEdit() {
    setEditingId(
      null
    );
    setForm(
      emptyForm()
    );
    setError("");
  }
  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload:
        Record<string, any> =
        {
          ...fixedValues,
        };
      fields.forEach(
        (field) => {
          let value =
            form[
              field.name
            ];
          if (
            field.type ===
            "number"
          ) {
            value =
              value === ""
                ? null
                : Number(
                    value
                  );
          }
          if (
            field.type ===
            "json"
          ) {
            if (
              typeof value ===
              "string"
            ) {
              value =
                value.trim()
                  ? JSON.parse(
                      value
                    )
                  : [];
            }
          }
          payload[
            field.name
          ] =
            value;
        }
      );
      let mutation;
      if (
        editingId
      ) {
        mutation =
          await supabase
            .from(table)
            .update(
              payload
            )
            .eq(
              "id",
              editingId
            );
      }
      else {
        mutation =
          await supabase
            .from(table)
            .insert(
              payload
            );
      }
      if (
        mutation.error
      ) {
        throw mutation.error;
      }
      cancelEdit();
      await loadRows();
    }
    catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Erreur pendant l'enregistrement."
      );
    }
    finally {
      setSaving(false);
    }
  }
  async function remove(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Supprimer définitivement cet élément ?"
      );
    if (
      !confirmed
    ) {
      return;
    }
    const {
      error:
        deleteError,
    } =
      await supabase
        .from(table)
        .delete()
        .eq(
          "id",
          id
        );
    if (
      deleteError
    ) {
      setError(
        deleteError.message
      );
      return;
    }
    await loadRows();
  }
  async function togglePublish(
    row: any
  ) {
    if (
      !publishField
    ) {
      return;
    }
    const {
      error:
        updateError,
    } =
      await supabase
        .from(table)
        .update({
          [publishField]:
            !row[
              publishField
            ],
        })
        .eq(
          "id",
          row.id
        );
    if (
      updateError
    ) {
      setError(
        updateError.message
      );
      return;
    }
    await loadRows();
  }
  return (
    <div
      className={
        styles.manager
      }
    >
      <header
        className={
          styles.heading
        }
      >
        <div>
          <small>
            ADMINISTRATION CREDESS
          </small>
          <h1>
            {title}
          </h1>
          {description && (
            <p>
              {description}
            </p>
          )}
        </div>
      </header>
      <form
        className={
          styles.form
        }
        onSubmit={
          submit
        }
      >
        <div
          className={
            styles.formHeader
          }
        >
          <strong>
            {editingId
              ? "Modifier"
              : "Ajouter"}
          </strong>
          {editingId && (
            <button
              type="button"
              onClick={
                cancelEdit
              }
            >
              Annuler la modification
            </button>
          )}
        </div>
        <div
          className={
            styles.fields
          }
        >
          {fields.map(
            (field) => (
              <label
                key={
                  field.name
                }
                className={
                  field.type ===
                    "textarea" ||
                  field.type ===
                    "json"
                    ? styles.fullField
                    : ""
                }
              >
                <span>
                  {field.label}
                </span>
                {field.type ===
                "textarea" ? (
                  <textarea
                    required={
                      field.required
                    }
                    value={
                      form[
                        field.name
                      ] ?? ""
                    }
                    placeholder={
                      field.placeholder
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        field.name,
                        event.target
                          .value
                      )
                    }
                  />
                ) : field.type ===
                "json" ? (
                  <textarea
                    value={
                      form[
                        field.name
                      ] ?? ""
                    }
                    placeholder={
                      field.placeholder ||
                      '["Option 1","Option 2"]'
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        field.name,
                        event.target
                          .value
                      )
                    }
                  />
                ) : field.type ===
                "boolean" ? (
                  <input
                    type="checkbox"
                    checked={
                      Boolean(
                        form[
                          field.name
                        ]
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        field.name,
                        event.target
                          .checked
                      )
                    }
                  />
                ) : field.type ===
                "select" ? (
                  <select
                    required={
                      field.required
                    }
                    value={
                      form[
                        field.name
                      ] ?? ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        field.name,
                        event.target
                          .value
                      )
                    }
                  >
                    <option
                      value=""
                    >
                      Sélectionner
                    </option>
                    {field.options?.map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option
                          }
                          value={
                            option
                          }
                        >
                          {option}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <input
                    type={
                      field.type ===
                      "number"
                        ? "number"
                        : "text"
                    }
                    required={
                      field.required
                    }
                    value={
                      form[
                        field.name
                      ] ?? ""
                    }
                    placeholder={
                      field.placeholder
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        field.name,
                        event.target
                          .value
                      )
                    }
                  />
                )}
              </label>
            )
          )}
        </div>
        {error && (
          <div
            className={
              styles.error
            }
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className={
            styles.save
          }
          disabled={
            saving
          }
        >
          {saving
            ? "Enregistrement..."
            : editingId
              ? "Enregistrer les modifications →"
              : "Ajouter →"}
        </button>
      </form>
      <section
        className={
          styles.list
        }
      >
        <header>
          <strong>
            Liste
          </strong>
          <span>
            {rows.length} élément(s)
          </span>
        </header>
        {loading ? (
          <div
            className={
              styles.empty
            }
          >
            Chargement...
          </div>
        ) : rows.length ===
          0 ? (
          <div
            className={
              styles.empty
            }
          >
            Aucun élément enregistré.
          </div>
        ) : (
          rows.map(
            (
              row,
              index
            ) => (
              <article
                className={
                  styles.row
                }
                key={
                  row.id
                }
              >
                <span
                  className={
                    styles.number
                  }
                >
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
                <div
                  className={
                    styles.rowContent
                  }
                >
                  <strong>
                    {
                      row.title ||
                      row.name ||
                      row.label ||
                      row.question ||
                      row.setting_key ||
                      row.section_key ||
                      row.reference ||
                      "Élément"
                    }
                  </strong>
                  <small>
                    {
                      row.role ||
                      row.slug ||
                      row.setting_value ||
                      row.status ||
                      ""
                    }
                  </small>
                </div>
                {publishField && (
                  <button
                    type="button"
                    className={
                      row[
                        publishField
                      ]
                        ? styles.published
                        : styles.hidden
                    }
                    onClick={() =>
                      togglePublish(
                        row
                      )
                    }
                  >
                    {row[
                      publishField
                    ]
                      ? "Publié"
                      : "Masqué"}
                  </button>
                )}
                <button
                  type="button"
                  className={
                    styles.edit
                  }
                  onClick={() =>
                    startEdit(
                      row
                    )
                  }
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className={
                    styles.delete
                  }
                  onClick={() =>
                    remove(
                      row.id
                    )
                  }
                >
                  Supprimer
                </button>
              </article>
            )
          )
        )}
      </section>
    </div>
  );
}