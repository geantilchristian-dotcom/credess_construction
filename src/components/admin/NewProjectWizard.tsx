"use client";
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  del,
  get,
  set,
} from "idb-keyval";
import {
  supabase,
} from "@/lib/supabase";
import styles from "./NewProjectWizard.module.css";
type ProjectForm = {
  title: string;
  category: string;
  projectType: string;
  customProjectType: string;
  location: string;
  year: string;
  surface: string;
  clientName: string;
  status: string;
  description: string;
  isPublished: boolean;
};
type PhotoItem = {
  id: string;
  file: File;
  preview: string;
};
type PhotoSection = {
  id: string;
  label: string;
  custom: boolean;
  photos: PhotoItem[];
  activeIndex: number;
};
const TOTAL_STEPS = 6;
const CREDESS_PROJECT_DRAFT =
  "credess-new-project-draft-v1";
const categories = [
  "Construction",
  "Architecture",
  "Études techniques",
  "Ingénierie",
  "Aménagement",
  "Rénovation",
];
const projectTypes = [
  "Maison",
  "Villa",
  "Immeuble résidentiel",
  "Immeuble commercial",
  "Bureau",
  "École",
  "Hôpital / Centre de santé",
  "Hôtel",
  "Église",
  "Entrepôt",
  "Résidence",
  "Autre",
];
const statusOptions = [
  "Planifié",
  "En cours",
  "Réalisé",
];
const photoSectionChoices = [
  "Plan architectural",
  "Modélisation 3D",
  "Préparation du terrain",
  "Fondations",
  "Élévation",
  "RDC",
  "R+1",
  "R+2",
  "R+3",
  "Toiture",
  "Installations techniques",
  "Plomberie",
  "Électricité",
  "Finitions",
  "Aménagement extérieur",
  "Projet terminé",
  "Autre rubrique",
];
function uid() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );
}
function slugify(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}
async function compressPhoto(
  file: File
) {
  const compressed =
    await imageCompression(
      file,
      {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType:
          "image/webp",
        initialQuality:
          0.72,
      }
    );
  return new File(
    [compressed],
    `${
      file.name
        .replace(
          /\.[^/.]+$/,
          ""
        )
    }.webp`,
    {
      type:
        "image/webp",
      lastModified:
        Date.now(),
    }
  );
}
export default function NewProjectWizard() {
  const router =
    useRouter();
  const [
    step,
    setStep,
  ] =
    useState(1);
  const [
    form,
    setForm,
  ] =
    useState<ProjectForm>({
      title: "",
      category:
        "Construction",
      projectType: "",
      customProjectType: "",
      location: "",
      year:
        String(
          new Date()
            .getFullYear()
        ),
      surface: "",
      clientName: "",
      status:
        "Réalisé",
      description: "",
      isPublished: true,
    });
  const [
    tasks,
    setTasks,
  ] =
    useState<string[]>([
      "",
    ]);
  const [
    coverFile,
    setCoverFile,
  ] =
    useState<File | null>(
      null
    );
  const [
    coverPreview,
    setCoverPreview,
  ] =
    useState("");
  const [
    sections,
    setSections,
  ] =
    useState<PhotoSection[]>([
      {
        id: "complete-project-gallery",
        label: "Images complètes du projet",
        custom: false,
        photos: [],
        activeIndex: 0,
      },
    ]);
  const [
    sectionChoice,
    setSectionChoice,
  ] =
    useState(
      "Plan architectural"
    );
  const [
    customSection,
    setCustomSection,
  ] =
    useState("");
  const [
    saving,
    setSaving,
  ] =
    useState(false);
  const [
    savingText,
    setSavingText,
  ] =
    useState("");
  const [
    uploadProgress,
    setUploadProgress,
  ] =
    useState(0);
  const [
    uploadProgressText,
    setUploadProgressText,
  ] =
    useState("");
  const [
    error,
    setError,
  ] =
    useState("");
  const [
    draftLoaded,
    setDraftLoaded,
  ] =
    useState(false);
  const [
    draftSaved,
    setDraftSaved,
  ] =
    useState(false);
  /* =========================================================
     RESTORE CREDESS DRAFT
     ========================================================= */
  useEffect(() => {
    let cancelled =
      false;
    async function restoreDraft() {
      try {
        const draft:
          any =
          await get(
            CREDESS_PROJECT_DRAFT
          );
        if (
          !draft ||
          cancelled
        ) {
          setDraftLoaded(
            true
          );
          return;
        }
        if (
          draft.form
        ) {
          setForm(
            draft.form
          );
        }
        if (
          Array.isArray(
            draft.tasks
          )
        ) {
          setTasks(
            draft.tasks
          );
        }
        if (
          typeof draft.step ===
          "number"
        ) {
          setStep(
            Math.min(
              Math.max(
                draft.step,
                1
              ),
              TOTAL_STEPS
            )
          );
        }
        if (
          draft.coverFile
        ) {
          setCoverFile(
            draft.coverFile
          );
          setCoverPreview(
            URL.createObjectURL(
              draft.coverFile
            )
          );
        }
        if (
          Array.isArray(
            draft.sections
          )
        ) {
          const restoredSections:
            PhotoSection[] =
            draft.sections.map(
              (
                section:
                  any
              ) => ({
                id:
                  section.id ||
                  uid(),
                label:
                  section.label,
                custom:
                  Boolean(
                    section.custom
                  ),
                activeIndex:
                  Math.min(
                    section.activeIndex ||
                    0,
                    Math.max(
                      (
                        section.photos ||
                        []
                      ).length -
                        1,
                      0
                    )
                  ),
                photos:
                  (
                    section.photos ||
                    []
                  ).map(
                    (
                      photo:
                        any
                    ) => ({
                      id:
                        photo.id ||
                        uid(),
                      file:
                        photo.file,
                      preview:
                        URL.createObjectURL(
                          photo.file
                        ),
                    })
                  ),
              })
            );
          const allRestoredPhotos =
          restoredSections
            .flatMap(
              (section) =>
                section.photos || []
            )
            .slice(
              0,
              10
            );
        setSections([
          {
            id:
              "complete-project-gallery",
            label:
              "Images complètes du projet",
            custom:
              false,
            activeIndex:
              0,
            photos:
              allRestoredPhotos,
          },
        ]);
        }
        if (
          draft.sectionChoice
        ) {
          setSectionChoice(
            draft.sectionChoice
          );
        }
        if (
          typeof draft.customSection ===
          "string"
        ) {
          setCustomSection(
            draft.customSection
          );
        }
      }
      catch (
        restoreError
      ) {
        console.error(
          "Erreur restauration brouillon CREDESS :",
          restoreError
        );
      }
      finally {
        if (
          !cancelled
        ) {
          setDraftLoaded(
            true
          );
        }
      }
    }
    restoreDraft();
    return () => {
      cancelled =
        true;
    };
  }, []);
  /* =========================================================
     AUTO SAVE CREDESS DRAFT
     ========================================================= */
  useEffect(() => {
    if (
      !draftLoaded
    ) {
      return;
    }
    const timer =
      window.setTimeout(
        async () => {
          try {
            const persistentSections =
              sections.map(
                (
                  section
                ) => ({
                  id:
                    section.id,
                  label:
                    section.label,
                  custom:
                    section.custom,
                  activeIndex:
                    section.activeIndex,
                  photos:
                    section.photos.map(
                      (
                        photo
                      ) => ({
                        id:
                          photo.id,
                        file:
                          photo.file,
                      })
                    ),
                })
              );
            await set(
              CREDESS_PROJECT_DRAFT,
              {
                version:
                  1,
                savedAt:
                  Date.now(),
                step,
                form,
                tasks,
                coverFile,
                sections:
                  persistentSections,
                sectionChoice,
                customSection,
              }
            );
            setDraftSaved(
              true
            );
            window.setTimeout(
              () =>
                setDraftSaved(
                  false
                ),
              1400
            );
          }
          catch (
            saveError
          ) {
            console.error(
              "Erreur sauvegarde brouillon CREDESS :",
              saveError
            );
          }
        },
        350
      );
    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    draftLoaded,
    step,
    form,
    tasks,
    coverFile,
    sections,
    sectionChoice,
    customSection,
  ]);  function updateForm<
    K extends keyof ProjectForm
  >(
    key: K,
    value: ProjectForm[K]
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  }
  function updateTask(
    index: number,
    value: string
  ) {
    setTasks(
      (previous) =>
        previous.map(
          (
            task,
            taskIndex
          ) =>
            taskIndex === index
              ? value
              : task
        )
    );
  }
  function addTask() {
    if (
      tasks.length >= 20
    ) {
      return;
    }
    setTasks(
      (previous) => [
        ...previous,
        "",
      ]
    );
  }
  function removeTask(
    index: number
  ) {
    setTasks(
      (previous) => {
        const next =
          previous.filter(
            (
              _,
              taskIndex
            ) =>
              taskIndex !==
              index
          );
        return (
          next.length > 0
            ? next
            : [""]
        );
      }
    );
  }
  function chooseCover(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];
    if (!file) {
      return;
    }
    if (
      coverPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        coverPreview
      );
    }
    setCoverFile(
      file
    );
    setCoverPreview(
      URL.createObjectURL(
        file
      )
    );
  }
  function addPhotoSection() {
    setError("");
    const label =
      sectionChoice ===
      "Autre rubrique"
        ? customSection.trim()
        : sectionChoice;
    if (!label) {
      setError(
        "Écrivez le nom de la rubrique."
      );
      return;
    }
    const exists =
      sections.some(
        (section) =>
          section.label
            .toLowerCase() ===
          label.toLowerCase()
      );
    if (exists) {
      setError(
        "Cette rubrique existe déjà."
      );
      return;
    }
    setSections(
      (previous) => [
        ...previous,
        {
          id:
            uid(),
          label,
          custom:
            sectionChoice ===
            "Autre rubrique",
          photos: [],
          activeIndex: 0,
        },
      ]
    );
    setCustomSection(
      ""
    );
  }
  function addPhotos(
    sectionId: string,
    files: FileList | null
  ) {
    if (
      !files ||
      files.length === 0
    ) {
      return;
    }
    setError("");
    const incomingFiles =
      Array.from(files);
    const supportedFiles =
      incomingFiles.filter(
        (file) => {
          const fileName =
            file.name
              .toLowerCase();
          const extensionAccepted =
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            fileName.endsWith(".png") ||
            fileName.endsWith(".webp");
          const mimeAccepted =
            !file.type ||
            file.type.startsWith("image/");
          return (
            extensionAccepted ||
            mimeAccepted
          );
        }
      );
    if (
      supportedFiles.length === 0
    ) {
      setError(
        "Les fichiers sélectionnés ne sont pas reconnus comme images JPG, JPEG, PNG ou WebP."
      );
      return;
    }
    setSections(
      (previousSections) => {
        return previousSections.map(
          (section) => {
            if (
              section.id !==
              sectionId
            ) {
              return section;
            }
            const availablePlaces =
              10 -
              section.photos.length;
            if (
              availablePlaces <= 0
            ) {
              setError(
                "Vous avez déjà atteint le maximum de 10 images."
              );
              return section;
            }
            const filesToAdd =
              supportedFiles.slice(
                0,
                availablePlaces
              );
            const addedPhotos:
              PhotoItem[] =
              filesToAdd.map(
                (file) => {
                  return {
                    id:
                      uid(),
                    file,
                    preview:
                      URL.createObjectURL(
                        file
                      ),
                  };
                }
              );
            const newPhotoList = [
              ...section.photos,
              ...addedPhotos,
            ];
            if (
              supportedFiles.length >
              availablePlaces
            ) {
              setError(
                `Maximum 10 images. ${availablePlaces} image(s) ont été ajoutées.`
              );
            }
            return {
              ...section,
              photos:
                newPhotoList,
              activeIndex:
                section.photos.length,
            };
          }
        );
      }
    );
  }  function previousPhoto(
    sectionId: string
  ) {
    setSections(
      (previous) =>
        previous.map(
          (section) => {
            if (
              section.id !==
              sectionId ||
              section.photos
                .length < 2
            ) {
              return section;
            }
            const count =
              section.photos
                .length;
            return {
              ...section,
              activeIndex:
                (
                  section.activeIndex -
                  1 +
                  count
                ) %
                count,
            };
          }
        )
    );
  }
  function nextPhoto(
    sectionId: string
  ) {
    setSections(
      (previous) =>
        previous.map(
          (section) => {
            if (
              section.id !==
              sectionId ||
              section.photos
                .length < 2
            ) {
              return section;
            }
            return {
              ...section,
              activeIndex:
                (
                  section.activeIndex +
                  1
                ) %
                section.photos
                  .length,
            };
          }
        )
    );
  }
  function showPhoto(
    sectionId: string,
    photoIndex: number
  ) {
    setSections(
      (previous) =>
        previous.map(
          (section) =>
            section.id ===
            sectionId
              ? {
                  ...section,
                  activeIndex:
                    photoIndex,
                }
              : section
        )
    );
  }
  function removeCurrentPhoto(
    sectionId: string
  ) {
    setSections(
      (previous) =>
        previous.map(
          (section) => {
            if (
              section.id !==
              sectionId ||
              !section.photos
                .length
            ) {
              return section;
            }
            const photo =
              section.photos[
                section.activeIndex
              ];
            URL.revokeObjectURL(
              photo.preview
            );
            const photos =
              section.photos
                .filter(
                  (
                    _,
                    index
                  ) =>
                    index !==
                    section.activeIndex
                );
            return {
              ...section,
              photos,
              activeIndex:
                Math.min(
                  section.activeIndex,
                  Math.max(
                    photos.length -
                      1,
                    0
                  )
                ),
            };
          }
        )
    );
  }
  function removeSection(
    sectionId: string
  ) {
    const found =
      sections.find(
        (section) =>
          section.id ===
          sectionId
      );
    found?.photos
      .forEach(
        (photo) =>
          URL.revokeObjectURL(
            photo.preview
          )
      );
    setSections(
      (previous) =>
        previous.filter(
          (section) =>
            section.id !==
            sectionId
        )
    );
  }
  function validateStep() {
    setError("");
    if (
      step === 1
    ) {
      if (
        !form.title.trim()
      ) {
        setError(
          "Le nom du projet est obligatoire."
        );
        return false;
      }
      if (
        !form.projectType
      ) {
        setError(
          "Choisissez le type de projet."
        );
        return false;
      }
      if (
        form.projectType ===
          "Autre" &&
        !form.customProjectType
          .trim()
      ) {
        setError(
          "Écrivez le type de projet."
        );
        return false;
      }
    }
    if (
      step === 2 &&
      !form.location.trim()
    ) {
      setError(
        "La localisation est obligatoire."
      );
      return false;
    }
    if (
      step === 4 &&
      !coverFile
    ) {
      setError(
        "Ajoutez la photo principale du projet."
      );
      return false;
    }
    return true;
  }
  function nextStep() {
    if (
      !validateStep()
    ) {
      return;
    }
    setStep(
      (current) =>
        Math.min(
          current + 1,
          TOTAL_STEPS
        )
    );
    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }
  function previousStep() {
    setError("");
    setStep(
      (current) =>
        Math.max(
          current - 1,
          1
        )
    );
    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }
  async function uploadImage(
    file: File,
    pathPrefix: string
  ) {
    const compressed =
      await compressPhoto(
        file
      );
    const path =
      `${pathPrefix}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.webp`;
    const {
      error:
        uploadError,
    } =
      await supabase
        .storage
        .from("projects")
        .upload(
          path,
          compressed,
          {
            upsert:
              false,
            contentType:
              "image/webp",
            cacheControl:
              "31536000",
          }
        );
    if (
      uploadError
    ) {
      throw uploadError;
    }
    const {
      data,
    } =
      supabase
        .storage
        .from("projects")
        .getPublicUrl(
          path
        );
    return data.publicUrl;
  }
  async function createProject() {
    setError("");
    setSaving(true);
    let projectId = "";
    try {
      const slug =
        slugify(
          form.title
        );
      const realProjectType =
        form.projectType ===
        "Autre"
          ? form.customProjectType
              .trim()
          : form.projectType;
      /*
       * On crée d'abord le projet MASQUÉ.
       * Il ne devient public qu'après tous
       * les uploads.
       */
      setSavingText(
        "Création du projet..."
      );
      const {
        data:
          lastOrder,
      } =
        await supabase
          .from("projects")
          .select(
            "sort_order"
          )
          .order(
            "sort_order",
            {
              ascending:
                false,
            }
          )
          .limit(1);
      const nextOrder =
        (
          lastOrder?.[0]
            ?.sort_order ||
          0
        ) + 1;
      const {
        data:
          newProject,
        error:
          projectError,
      } =
        await supabase
          .from("projects")
          .insert({
            title:
              form.title
                .trim(),
            slug,
            category:
              form.category,
            project_type:
              realProjectType,
            location:
              form.location
                .trim(),
            year:
              form.year
                ? Number(
                    form.year
                  )
                : null,
            surface:
              form.surface
                .trim() ||
              null,
            client_name:
              form.clientName
                .trim() ||
              null,
            status:
              form.status,
            description:
              form.description
                .trim() ||
              null,
            cover_url:
              null,
            is_published:
              false,
            sort_order:
              nextOrder,
          })
          .select(
            "id"
          )
          .single();
      if (
        projectError ||
        !newProject
      ) {
        throw (
          projectError ||
          new Error(
            "Impossible de créer le projet."
          )
        );
      }
      projectId =
        newProject.id;
      /*
       * COUVERTURE
       */
      setSavingText(
        "Compression de la photo principale..."
      );
      if (
        !coverFile
      ) {
        throw new Error(
          "Photo principale absente."
        );
      }
      const coverUrl =
        await uploadImage(
          coverFile,
          `${slug}/cover`
        );
      const {
        error:
          coverError,
      } =
        await supabase
          .from("projects")
          .update({
            cover_url:
              coverUrl,
          })
          .eq(
            "id",
            projectId
          );
      if (
        coverError
      ) {
        throw coverError;
      }
      /*
       * TRAVAUX
       */
      const cleanTasks =
        tasks
          .map(
            (task) =>
              task.trim()
          )
          .filter(Boolean);
      if (
        cleanTasks.length
      ) {
        setSavingText(
          "Enregistrement des travaux réalisés..."
        );
        const {
          error:
            tasksError,
        } =
          await supabase
            .from(
              "project_tasks"
            )
            .insert(
              cleanTasks.map(
                (
                  title,
                  index
                ) => ({
                  project_id:
                    projectId,
                  title,
                  sort_order:
                    index,
                })
              )
            );
        if (
          tasksError
        ) {
          throw tasksError;
        }
      }
      /*
       * IMAGES COMPLETES DU PROJET
       */
      let globalOrder =
        0;
      let uploadedPhotoCount =
        0;
      const totalPhotoUploads =
        sections.reduce(
          (
            total,
            section
          ) =>
            total +
            section.photos.length,
          0
        );
      setUploadProgress(
        0
      );
      setUploadProgressText(
        totalPhotoUploads > 0
          ? `Chargement de 0/${totalPhotoUploads} images`
          : ""
      );
      for (
        const section of
        sections
      ) {
        const sectionKey =
          slugify(
            section.label
          );
        for (
          let index = 0;
          index <
          section.photos.length;
          index++
        ) {
          setSavingText(
            `${section.label} : photo ${index + 1}/${section.photos.length}`
          );
          const imageUrl =
            await uploadImage(
              section.photos[index]
                .file,
              `${slug}/${sectionKey}`
            );
          const {
            error:
              imageError,
          } =
            await supabase
              .from(
                "project_images"
              )
              .insert({
                project_id:
                  projectId,
                image_url:
                  imageUrl,
                label:
                  section.label,
                description:
                  null,
                stage_type:
                  section.label,
                section_key:
                  sectionKey,
                section_label:
                  section.label,
                image_order:
                  index,
                sort_order:
                  globalOrder,
              });
          if (
            imageError
          ) {
            throw imageError;
          }
          globalOrder++;
          uploadedPhotoCount++;
          if (
            totalPhotoUploads >
            0
          ) {
            const progress =
              Math.round(
                uploadedPhotoCount /
                totalPhotoUploads *
                100
              );
            setUploadProgress(
              progress
            );
            setUploadProgressText(
              `Chargement des images : ${uploadedPhotoCount}/${totalPhotoUploads}`
            );
          }
        }
      }
      /*
       * PUBLICATION FINALE
       */
      setSavingText(
        form.isPublished
          ? "Publication du projet..."
          : "Enregistrement..."
      );
      const {
        error:
          publishError,
      } =
        await supabase
          .from("projects")
          .update({
            is_published:
              form.isPublished,
          })
          .eq(
            "id",
            projectId
          );
      if (
        publishError
      ) {
        throw publishError;
      }
      /*
       * Le projet est maintenant réellement enregistré
       * dans Supabase : on peut supprimer le brouillon local.
       */
      await del(
        CREDESS_PROJECT_DRAFT
      );
      router.replace(
        `/admin/projets/${projectId}`
      );
      router.refresh();
    }
    catch (
      caught
    ) {
      console.error(
        caught
      );
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible d'enregistrer le projet."
      );
      setSavingText(
        ""
      );
      /*
       * Si une erreur arrive après création,
       * on laisse le projet masqué afin de
       * pouvoir diagnostiquer sans publier
       * un projet incomplet.
       */
    }
    finally {
      setSaving(false);
    }
  }
  const photoCount =
    useMemo(
      () =>
        sections.reduce(
          (
            total,
            section
          ) =>
            total +
            section.photos
              .length,
          0
        ),
      [sections]
    );
  return (
    <main
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <Link
          href="/admin/projets"
        >
          ← Annuler
        </Link>
        <div>
          <strong>
            CREDESS
          </strong>
          <small>
            NOUVEAU PROJET
          </small>
        </div>
      </header>
      <section
        className={
          styles.progress
        }
      >
        <div>
          <strong>
            ÉTAPE {step} SUR {TOTAL_STEPS}
          </strong>
          <span>
            {Math.round(
              step /
                TOTAL_STEPS *
                100
            )}%
          </span>
        </div>
        <div
          className={
            styles.progressTrack
          }
        >
          <span
            style={{
              width:
                `${step / TOTAL_STEPS * 100}%`,
            }}
          />
        </div>
      </section>
      {draftSaved && (
        <div
          className={
            styles.draftSaved
          }
        >
          Brouillon sauvegardé automatiquement
        </div>
      )}
      <section
        className={
          styles.card
        }
      >
        {/* =================================================
            ETAPE 1
        ================================================== */}
        {step === 1 && (
          <div
            className={
              styles.step
            }
          >
            <small>
              IDENTITÉ DU PROJET
            </small>
            <h1>
              Quel projet ajoutez-vous ?
            </h1>
            <label>
              Nom du projet
              <input
                autoFocus
                value={
                  form.title
                }
                onChange={
                  (event) =>
                    updateForm(
                      "title",
                      event.target
                        .value
                    )
                }
                placeholder="Ex. Résidence La Grâce"
              />
            </label>
            <h3
              className={
                styles.fieldTitle
              }
            >
              Catégorie
            </h3>
            <div
              className={
                styles.choiceGrid
              }
            >
              {categories.map(
                (category) => (
                  <button
                    type="button"
                    key={
                      category
                    }
                    className={
                      form.category ===
                      category
                        ? styles.selected
                        : ""
                    }
                    onClick={() =>
                      updateForm(
                        "category",
                        category
                      )
                    }
                  >
                    {category}
                    <span>
                      {form.category ===
                      category
                        ? "✓"
                        : "→"}
                    </span>
                  </button>
                )
              )}
            </div>
            <h3
              className={
                styles.fieldTitle
              }
            >
              Type de projet
            </h3>
            <div
              className={
                styles.choiceGrid
              }
            >
              {projectTypes.map(
                (type) => (
                  <button
                    type="button"
                    key={
                      type
                    }
                    className={
                      form.projectType ===
                      type
                        ? styles.selected
                        : ""
                    }
                    onClick={() =>
                      updateForm(
                        "projectType",
                        type
                      )
                    }
                  >
                    {type}
                    <span>
                      {form.projectType ===
                      type
                        ? "✓"
                        : "→"}
                    </span>
                  </button>
                )
              )}
            </div>
            {form.projectType ===
              "Autre" && (
              <label>
                Précisez le type
                <input
                  value={
                    form.customProjectType
                  }
                  onChange={
                    (event) =>
                      updateForm(
                        "customProjectType",
                        event.target
                          .value
                      )
                  }
                  placeholder="Écrivez le type de projet..."
                />
              </label>
            )}
          </div>
        )}
        {/* =================================================
            ETAPE 2
        ================================================== */}
        {step === 2 && (
          <div
            className={
              styles.step
            }
          >
            <small>
              INFORMATIONS DU PROJET
            </small>
            <h1>
              Où en est le projet ?
            </h1>
            <label>
              Localisation
              <input
                autoFocus
                value={
                  form.location
                }
                onChange={
                  (event) =>
                    updateForm(
                      "location",
                      event.target
                        .value
                    )
                }
                placeholder="Ex. Bukavu"
              />
            </label>
            <div
              className={
                styles.twoColumns
              }
            >
              <label>
                Année
                <input
                  type="number"
                  value={
                    form.year
                  }
                  onChange={
                    (event) =>
                      updateForm(
                        "year",
                        event.target
                          .value
                      )
                  }
                />
              </label>
              <label>
                Surface
                <input
                  value={
                    form.surface
                  }
                  onChange={
                    (event) =>
                      updateForm(
                        "surface",
                        event.target
                          .value
                      )
                  }
                  placeholder="Ex. 500 m²"
                />
              </label>
            </div>
            <label>
              Client
              <input
                value={
                  form.clientName
                }
                onChange={
                  (event) =>
                    updateForm(
                      "clientName",
                      event.target
                        .value
                    )
                }
                placeholder="Ex. Client privé"
              />
            </label>
            <h3
              className={
                styles.fieldTitle
              }
            >
              Statut du projet
            </h3>
            <div
              className={
                styles.choiceGrid
              }
            >
              {statusOptions.map(
                (status) => (
                  <button
                    type="button"
                    key={
                      status
                    }
                    className={
                      form.status ===
                      status
                        ? styles.selected
                        : ""
                    }
                    onClick={() =>
                      updateForm(
                        "status",
                        status
                      )
                    }
                  >
                    {status}
                    <span>
                      {form.status ===
                      status
                        ? "✓"
                        : "→"}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
        {/* =================================================
            ETAPE 3
        ================================================== */}
        {step === 3 && (
          <div
            className={
              styles.step
            }
          >
            <small>
              À PROPOS DU PROJET
            </small>
            <h1>
              Présentez la réalisation
            </h1>
            <label>
              Description complète
              <textarea
                value={
                  form.description
                }
                onChange={
                  (event) =>
                    updateForm(
                      "description",
                      event.target
                        .value
                    )
                }
                placeholder="Expliquez le projet, sa conception, les choix techniques et les particularités..."
              />
            </label>
            <div
              className={
                styles.tasksTitle
              }
            >
              <strong>
                Travaux réalisés
              </strong>
              <span>
                Ajoutez les différentes interventions de CREDESS.
              </span>
            </div>
            <div
              className={
                styles.tasks
              }
            >
              {tasks.map(
                (
                  task,
                  index
                ) => (
                  <div
                    className={
                      styles.task
                    }
                    key={
                      index
                    }
                  >
                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>
                    <input
                      value={
                        task
                      }
                      onChange={
                        (event) =>
                          updateTask(
                            index,
                            event.target
                              .value
                          )
                      }
                      placeholder="Ex. Conception architecturale"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        removeTask(
                          index
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
            <button
              type="button"
              className={
                styles.addLine
              }
              onClick={
                addTask
              }
            >
              + Ajouter un travail réalisé
            </button>
          </div>
        )}
        {/* =================================================
            ETAPE 4
        ================================================== */}
        {step === 4 && (
          <div
            className={
              styles.step
            }
          >
            <small>
              PHOTO PRINCIPALE
            </small>
            <h1>
              Quelle image représentera le projet ?
            </h1>
            <label
              className={
                styles.coverUpload
              }
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={
                  chooseCover
                }
              />
              {coverPreview ? (
                <img
                  src={
                    coverPreview
                  }
                  alt="Photo principale"
                />
              ) : (
                <div>
                  <strong>
                    + Choisir la photo de couverture
                  </strong>
                  <span>
                    JPG, PNG ou WebP
                  </span>
                  <span>
                    Compression automatique avant Supabase
                  </span>
                </div>
              )}
            </label>
          </div>
        )}
        {/* =================================================
            ETAPE 5 : IMAGES COMPLETES
        ================================================== */}
        {step === 5 && (
          <div
            className={
              styles.step
            }
          >
            <small>
              PHOTOS DU PROJET
            </small>
            <h1>
              Images complètes du projet
            </h1>
            <p
              className={
                styles.intro
              }
            >
              Ajoutez toutes les images utiles du projet :
              plans, vues 3D, chantier, travaux, finitions
              et résultat final. Maximum 10 images.
            </p>
            {sections[0] && (
              <article
                className={
                  styles.photoSection
                }
              >
                <header>
                  <div>
                    <strong>
                      Galerie du projet
                    </strong>
                    <span>
                      {sections[0].photos.length}
                      {" / 10 images"}
                    </span>
                  </div>
                </header>
                {sections[0].photos.length > 0 ? (
                  <>
                    <div
                      className={
                        styles.carousel
                      }
                    >
                      <img
                        src={
                          sections[0]
                            .photos[
                              sections[0].activeIndex
                            ]
                            .preview
                        }
                        alt="Image du projet"
                      />
                      {sections[0].photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            className={
                              styles.leftArrow
                            }
                            onClick={() =>
                              previousPhoto(
                                sections[0].id
                              )
                            }
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className={
                              styles.rightArrow
                            }
                            onClick={() =>
                              nextPhoto(
                                sections[0].id
                              )
                            }
                          >
                            ›
                          </button>
                        </>
                      )}
                      <span
                        className={
                          styles.photoCounter
                        }
                      >
                        {sections[0].activeIndex + 1}
                        {" / "}
                        {sections[0].photos.length}
                      </span>
                    </div>
                    <div
                      className={
                        styles.thumbnails
                      }
                    >
                      {sections[0].photos.map(
                        (
                          photo,
                          photoIndex
                        ) => (
                          <button
                            type="button"
                            key={
                              photo.id
                            }
                            className={
                              photoIndex ===
                              sections[0].activeIndex
                                ? styles.thumbActive
                                : styles.thumb
                            }
                            onClick={() =>
                              showPhoto(
                                sections[0].id,
                                photoIndex
                              )
                            }
                          >
                            <img
                              src={
                                photo.preview
                              }
                              alt=""
                            />
                          </button>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    className={
                      styles.emptyPhotos
                    }
                  >
                    Aucune image ajoutée.
                  </div>
                )}
                <div
                  className={
                    styles.galleryCounter
                  }
                >
                  <div>
                    <span>
                      {
                        sections[0]
                          .photos.length
                      }
                      {" / 10"}
                    </span>
                    <strong>
                      images sélectionnées
                    </strong>
                  </div>
                  <div
                    className={
                      styles.galleryProgress
                    }
                  >
                    <span
                      style={{
                        width:
                          `${
                            sections[0]
                              .photos.length /
                            10 *
                            100
                          }%`,
                      }}
                    />
                  </div>
                </div>
                <footer
                  className={
                    styles.singleGalleryFooter
                  }
                >
                  <label
                    className={
                      sections[0].photos.length >=
                      10
                        ? styles.addPhotoDisabled
                        : styles.addPhoto
                    }
                  >
                    <input
                      type="file"
                      multiple
                      disabled={
                        sections[0].photos.length >=
                        10
                      }
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={(event) => {
                        const selectedFiles =
                          event.currentTarget.files;
                        if (
                          selectedFiles &&
                          selectedFiles.length > 0
                        ) {
                          addPhotos(
                            sections[0].id,
                            selectedFiles
                          );
                        }
                        /*
                         * Permet de sélectionner de nouveau
                         * exactement la même image plus tard.
                         */
                        event.currentTarget.value =
                          "";
                      }}
                    />
                    {sections[0].photos.length >=
                    10
                      ? "10 / 10 — Maximum atteint"
                      : "+ Ajouter les images complètes du projet"}
                  </label>
                  {sections[0].photos.length > 0 && (
                    <button
                      type="button"
                      className={
                        styles.deletePhoto
                      }
                      onClick={() =>
                        removeCurrentPhoto(
                          sections[0].id
                        )
                      }
                    >
                      Supprimer l'image affichée
                    </button>
                  )}
                </footer>
              </article>
            )}
          </div>
        )}
        {/* =================================================
            ETAPE 6
        ================================================== */}
        {step === 6 && (
          <div
            className={
              styles.step
            }
          >
            <small>
              VÉRIFICATION
            </small>
            <h1>
              Le projet est-il prêt ?
            </h1>
            {coverPreview && (
              <img
                className={
                  styles.summaryImage
                }
                src={
                  coverPreview
                }
                alt={
                  form.title
                }
              />
            )}
            <div
              className={
                styles.summary
              }
            >
              <article>
                <span>
                  PROJET
                </span>
                <strong>
                  {form.title}
                </strong>
              </article>
              <article>
                <span>
                  TYPE
                </span>
                <strong>
                  {form.projectType ===
                  "Autre"
                    ? form.customProjectType
                    : form.projectType}
                </strong>
              </article>
              <article>
                <span>
                  CATÉGORIE
                </span>
                <strong>
                  {form.category}
                </strong>
              </article>
              <article>
                <span>
                  LOCALISATION
                </span>
                <strong>
                  {form.location}
                </strong>
              </article>
              <article>
                <span>
                  STATUT
                </span>
                <strong>
                  {form.status}
                </strong>
              </article>
              <article>
                <span>
                  ANNÉE
                </span>
                <strong>
                  {form.year}
                </strong>
              </article>
              <article>
                <span>
                  RUBRIQUES PHOTOS
                </span>
                <strong>
                  {sections.length}
                </strong>
              </article>
              <article>
                <span>
                  PHOTOS DU PROJET
                </span>
                <strong>
                  {photoCount}
                </strong>
              </article>
            </div>
            {sections.length >
              0 && (
              <div
                className={
                  styles.sectionSummary
                }
              >
                <strong>
                  Photos enregistrées
                </strong>
                {sections.map(
                  (section) => (
                    <div
                      key={
                        section.id
                      }
                    >
                      <span>
                        {section.label}
                      </span>
                      <b>
                        {section.photos.length} photo(s)
                      </b>
                    </div>
                  )
                )}
              </div>
            )}
            <label
              className={
                styles.publish
              }
            >
              <input
                type="checkbox"
                checked={
                  form.isPublished
                }
                onChange={
                  (event) =>
                    updateForm(
                      "isPublished",
                      event.target
                        .checked
                    )
                }
              />
              <div>
                <strong>
                  Publier immédiatement
                </strong>
                <span>
                  Le projet apparaîtra sur le site public après l'enregistrement.
                </span>
              </div>
            </label>
          </div>
        )}
        {error && (
          <div
            className={
              styles.error
            }
          >
            {error}
          </div>
        )}
        {savingText && (
          <div
            className={
              styles.saving
            }
          >
            {savingText}
          </div>
        )}
        {saving &&
          uploadProgressText && (
          <div
            className={
              styles.uploadProgressBox
            }
          >
            <div
              className={
                styles.uploadProgressHeader
              }
            >
              <strong>
                {uploadProgressText}
              </strong>
              <span>
                {uploadProgress}%
              </span>
            </div>
            <div
              className={
                styles.uploadProgressTrack
              }
            >
              <span
                style={{
                  width:
                    `${uploadProgress}%`,
                }}
              />
            </div>
          </div>
        )}
        <div
          className={
            styles.navigation
          }
        >
          {step > 1 ? (
            <button
              type="button"
              className={
                styles.previous
              }
              disabled={
                saving
              }
              onClick={
                previousStep
              }
            >
              ← Précédent
            </button>
          ) : (
            <span />
          )}
          {step <
          TOTAL_STEPS ? (
            <button
              type="button"
              className={
                styles.next
              }
              onClick={
                nextStep
              }
            >
              Continuer
              <span>→</span>
            </button>
          ) : (
            <button
              type="button"
              className={
                styles.next
              }
              disabled={
                saving
              }
              onClick={
                createProject
              }
            >
              {saving
                ? "Enregistrement..."
                : "Créer le projet"}
              <span>→</span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}