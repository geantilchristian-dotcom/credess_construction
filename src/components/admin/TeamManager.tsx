"use client";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import imageCompression from
  "browser-image-compression";
import { adminFetch } from "@/lib/admin-fetch";

import styles from
  "./TeamManager.module.css";
type TeamMember = {
  id: string;
  name: string;
  role: string;
  photo_url:
    string | null;
  phone:
    string | null;
  email:
    string | null;
  sort_order:
    number;
  is_published:
    boolean;
};
async function readApiResponse(
  response: Response
) {
  const text =
    await response.text();
  if (!text) {
    return {
      success:
        false,
      message:
        `HTTP ${response.status} ${response.statusText}`,
    };
  }
  try {
    return JSON.parse(
      text
    );
  }
  catch {
    return {
      success:
        false,
      message:
        `HTTP ${response.status} : ${text}`,
    };
  }
}export default function TeamManager() {
  const [
    members,
    setMembers,
  ] =
    useState<
      TeamMember[]
    >([]);
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
    useState<
      string | null
    >(null);
  const [
    name,
    setName,
  ] =
    useState("");
  const [
    role,
    setRole,
  ] =
    useState("");
  const [
    phone,
    setPhone,
  ] =
    useState("");
  const [
    email,
    setEmail,
  ] =
    useState("");
  const [
    photo,
    setPhoto,
  ] =
    useState<
      File | null
    >(null);
  const [
    preview,
    setPreview,
  ] =
    useState("");
  const [
    currentPhoto,
    setCurrentPhoto,
  ] =
    useState("");
  const [
    removeCurrentPhoto,
    setRemoveCurrentPhoto,
  ] =
    useState(false);
  const [
    error,
    setError,
  ] =
    useState("");
  const [
    success,
    setSuccess,
  ] =
    useState("");
  async function loadMembers() {
    setLoading(
      true
    );
    try {
      const response =
        await adminFetch(
          "/api/admin/team",
          {
            cache:
              "no-store",
          }
        );
      const result =
        await readApiResponse(response);
      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
          "Chargement impossible."
        );
      }
      setMembers(
        result.members
      );
    }
    catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Erreur de chargement."
      );
    }
    finally {
      setLoading(
        false
      );
    }
  }
  useEffect(() => {
    loadMembers();
  }, []);
  function clearPhotoPreview() {
    if (
      preview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        preview
      );
    }
  }
  function resetForm() {
    clearPhotoPreview();
    setEditingId(
      null
    );
    setName("");
    setRole("");
    setPhone("");
    setEmail("");
    setPhoto(
      null
    );
    setPreview("");
    setCurrentPhoto("");
    setRemoveCurrentPhoto(
      false
    );
    setError("");
  }
  async function choosePhoto(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];
    event.target.value =
      "";
    if (!file) {
      return;
    }
    setError("");
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Choisissez une image JPG, PNG ou WebP."
      );
      return;
    }
    try {
      const compressed =
        await imageCompression(
          file,
          {
            maxSizeMB:
              0.35,
            maxWidthOrHeight:
              1000,
            useWebWorker:
              true,
            fileType:
              "image/webp",
            initialQuality:
              0.78,
          }
        );
      const webpFile =
        new File(
          [
            compressed,
          ],
          `${file.name.replace(
            /\.[^/.]+$/,
            ""
          )}.webp`,
          {
            type:
              "image/webp",
            lastModified:
              Date.now(),
          }
        );
      clearPhotoPreview();
      setPhoto(
        webpFile
      );
      setPreview(
        URL.createObjectURL(
          webpFile
        )
      );
      setRemoveCurrentPhoto(
        false
      );
    }
    catch (caught) {
      console.error(
        caught
      );
      setError(
        "Impossible de préparer cette photo."
      );
    }
  }
  function editMember(
    member:
      TeamMember
  ) {
    clearPhotoPreview();
    setEditingId(
      member.id
    );
    setName(
      member.name
    );
    setRole(
      member.role
    );
    setPhone(
      member.phone ||
      ""
    );
    setEmail(
      member.email ||
      ""
    );
    setPhoto(
      null
    );
    setPreview("");
    setCurrentPhoto(
      member.photo_url ||
      ""
    );
    setRemoveCurrentPhoto(
      false
    );
    setError("");
    setSuccess("");
    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }
  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError(
        "Écrivez le nom du membre."
      );
      return;
    }
    if (!role.trim()) {
      setError(
        "Écrivez sa fonction."
      );
      return;
    }
    setSaving(
      true
    );
    try {
      const form =
        new FormData();
      form.append(
        "name",
        name.trim()
      );
      form.append(
        "role",
        role.trim()
      );
      form.append(
        "phone",
        phone.trim()
      );
      form.append(
        "email",
        email.trim()
      );
      if (photo) {
        form.append(
          "photo",
          photo
        );
      }
      if (
        editingId
      ) {
        form.append(
          "id",
          editingId
        );
        form.append(
          "remove_image",
          String(
            removeCurrentPhoto
          )
        );
      }
      else {
        form.append(
          "is_published",
          "true"
        );
      }
      const response =
        await adminFetch(
          "/api/admin/team",
          {
            method:
              editingId
                ? "PATCH"
                : "POST",
            body:
              form,
          }
        );
      const result =
        await readApiResponse(response);
      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
          "Enregistrement impossible."
        );
      }
      const wasEditing =
        Boolean(
          editingId
        );
      resetForm();
      setSuccess(
        wasEditing
          ? "Membre modifié avec succès."
          : "Membre ajouté avec succès."
      );
      await loadMembers();
    }
    catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Erreur pendant l'enregistrement."
      );
    }
    finally {
      setSaving(
        false
      );
    }
  }
  async function togglePublished(
    member:
      TeamMember
  ) {
    setError("");
    setSuccess("");
    const form =
      new FormData();
    form.append(
      "id",
      member.id
    );
    form.append(
      "is_published",
      String(
        !member.is_published
      )
    );
    try {
      const response =
        await adminFetch(
          "/api/admin/team",
          {
            method:
              "PATCH",
            body:
              form,
          }
        );
      const result =
        await readApiResponse(response);
      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
          "Modification impossible."
        );
      }
      await loadMembers();
    }
    catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Modification impossible."
      );
    }
  }
  async function deleteMember(
    member:
      TeamMember
  ) {
    const confirmed =
      window.confirm(
        `Supprimer définitivement ${member.name} de l'équipe ?`
      );
    if (!confirmed) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const response =
        await adminFetch(
          "/api/admin/team",
          {
            method:
              "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                id:
                  member.id,
              }),
          }
        );
      const result =
        await readApiResponse(response);
      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
          "Suppression impossible."
        );
      }
      if (
        editingId ===
        member.id
      ) {
        resetForm();
      }
      setSuccess(
        "Membre supprimé."
      );
      await loadMembers();
    }
    catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Suppression impossible."
      );
    }
  }
  const visiblePhoto =
    preview ||
    (
      removeCurrentPhoto
        ? ""
        : currentPhoto
    );
  return (
    <div
      className={
        styles.page
      }
    >
      <header
        className={
          styles.heading
        }
      >
        <small>
          ADMINISTRATION CREDESS
        </small>
        <h1>
          Notre équipe
        </h1>
        <p>
          Gérez les personnes présentées
          sur le site de CREDESS Construction.
        </p>
      </header>
      <section
        className={
          styles.editor
        }
      >
        <div
          className={
            styles.editorTitle
          }
        >
          <div>
            <small>
              {editingId
                ? "MODIFICATION"
                : "NOUVEAU MEMBRE"}
            </small>
            <h2>
              {editingId
                ? "Modifier le membre"
                : "Ajouter une personne"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={
                resetForm
              }
            >
              Annuler
            </button>
          )}
        </div>
        <form
          onSubmit={
            submit
          }
          className={
            styles.form
          }
        >
          <div
            className={
              styles.photoColumn
            }
          >
            <div
              className={
                styles.photoPreview
              }
            >
              {visiblePhoto ? (
                <img
                  src={
                    visiblePhoto
                  }
                  alt="Aperçu"
                />
              ) : (
                <div
                  className={
                    styles.initials
                  }
                >
                  {name
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                    "?"}
                </div>
              )}
            </div>
            <label
              className={
                styles.photoButton
              }
            >
              <input
                type="file"
                accept="
                  image/jpeg,
                  image/png,
                  image/webp
                "
                onChange={
                  choosePhoto
                }
              />
              {visiblePhoto
                ? "Changer la photo"
                : "+ Ajouter une photo"}
            </label>
            {currentPhoto &&
              !preview &&
              !removeCurrentPhoto && (
              <button
                type="button"
                className={
                  styles.removePhoto
                }
                onClick={() =>
                  setRemoveCurrentPhoto(
                    true
                  )
                }
              >
                Supprimer la photo
              </button>
            )}
            {removeCurrentPhoto && (
              <button
                type="button"
                className={
                  styles.restorePhoto
                }
                onClick={() =>
                  setRemoveCurrentPhoto(
                    false
                  )
                }
              >
                Restaurer la photo
              </button>
            )}
          </div>
          <div
            className={
              styles.fields
            }
          >
            <label>
              <span>
                Nom complet *
              </span>
              <input
                value={
                  name
                }
                onChange={(
                  event
                ) =>
                  setName(
                    event.target
                      .value
                  )
                }
                placeholder="Ex. Jean Mbuyi"
              />
            </label>
            <label>
              <span>
                Fonction *
              </span>
              <input
                value={
                  role
                }
                onChange={(
                  event
                ) =>
                  setRole(
                    event.target
                      .value
                  )
                }
                placeholder="Ex. Ingénieur en construction"
              />
            </label>
            <label>
              <span>
                Téléphone
              </span>
              <input
                value={
                  phone
                }
                onChange={(
                  event
                ) =>
                  setPhone(
                    event.target
                      .value
                  )
                }
                placeholder="+243 ..."
              />
            </label>
            <label>
              <span>
                E-mail
              </span>
              <input
                type="email"
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                placeholder="nom@exemple.com"
              />
            </label>
            <div
              className={
                styles.help
              }
            >
              La position dans la liste est
              gérée automatiquement.
              Vous pourrez publier ou masquer
              le membre directement après
              l'enregistrement.
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
            {success && (
              <div
                className={
                  styles.success
                }
              >
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={
                saving
              }
              className={
                styles.save
              }
            >
              {saving
                ? "Enregistrement..."
                : editingId
                  ? "Enregistrer les modifications →"
                  : "Ajouter à l'équipe →"}
            </button>
          </div>
        </form>
      </section>
      <section
        className={
          styles.membersSection
        }
      >
        <header
          className={
            styles.listHeading
          }
        >
          <div>
            <small>
              ÉQUIPE CREDESS
            </small>
            <h2>
              Membres enregistrés
            </h2>
          </div>
          <strong>
            {members.length}
          </strong>
        </header>
        {loading ? (
          <div
            className={
              styles.empty
            }
          >
            Chargement de l'équipe...
          </div>
        ) : members.length ===
          0 ? (
          <div
            className={
              styles.empty
            }
          >
            <strong>
              Aucun membre enregistré.
            </strong>
            <span>
              Utilisez le formulaire ci-dessus
              pour ajouter la première personne.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.memberGrid
            }
          >
            {members.map(
              (member) => (
                <article
                  key={
                    member.id
                  }
                  className={
                    styles.memberCard
                  }
                >
                  <div
                    className={
                      styles.memberPhoto
                    }
                  >
                    {member.photo_url ? (
                      <img
                        src={
                          member.photo_url
                        }
                        alt={
                          member.name
                        }
                      />
                    ) : (
                      <span>
                        {member.name
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div
                    className={
                      styles.memberInfo
                    }
                  >
                    <div
                      className={
                        styles.statusRow
                      }
                    >
                      <span
                        className={
                          member.is_published
                            ? styles.online
                            : styles.offline
                        }
                      >
                        {member.is_published
                          ? "PUBLIÉ"
                          : "MASQUÉ"}
                      </span>
                    </div>
                    <h3>
                      {member.name}
                    </h3>
                    <strong>
                      {member.role}
                    </strong>
                    {(member.phone ||
                      member.email) && (
                      <div
                        className={
                          styles.contactInfo
                        }
                      >
                        {member.phone && (
                          <span>
                            {member.phone}
                          </span>
                        )}
                        {member.email && (
                          <span>
                            {member.email}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className={
                      styles.memberActions
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        editMember(
                          member
                        )
                      }
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        togglePublished(
                          member
                        )
                      }
                    >
                      {member.is_published
                        ? "Masquer"
                        : "Publier"}
                    </button>
                    <button
                      type="button"
                      className={
                        styles.delete
                      }
                      onClick={() =>
                        deleteMember(
                          member
                        )
                      }
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}