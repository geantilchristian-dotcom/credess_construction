import {
  createClient,
} from "@supabase/supabase-js";
import {
  notFound,
} from "next/navigation";
import Link from "next/link";
import ProjectGallery, {
  GalleryImage,
} from "@/components/projects/ProjectGallery";
import styles from "./project.module.css";
import { whatsappUrl } from "@/lib/credess-links";
export const dynamic =
  "force-dynamic";
type AnyRow =
  Record<string, any>;
function getSupabase() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (
    !url ||
    !key
  ) {
    throw new Error(
      "Configuration Supabase publique manquante."
    );
  }
  return createClient(
    url,
    key,
    {
      auth: {
        persistSession:
          false,
        autoRefreshToken:
          false,
      },
    }
  );
}
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const {
    slug,
  } =
    await params;
  const supabase =
    getSupabase();
  const {
    data: project,
    error: projectError,
  } =
    await supabase
      .from("projects")
      .select("*")
      .eq(
        "slug",
        slug
      )
      .eq(
        "is_published",
        true
      )
      .maybeSingle();
  if (
    projectError ||
    !project
  ) {
    notFound();
  }
  let tasks:
    AnyRow[] =
    [];
  let images:
    AnyRow[] =
    [];
  const [
    tasksResult,
    imagesResult,
    settingsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "project_tasks"
        )
        .select("*")
        .eq(
          "project_id",
          project.id
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        ),
      supabase
        .from(
          "project_images"
        )
        .select("*")
        .eq(
          "project_id",
          project.id
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        ),
      supabase
        .from("site_settings")
        .select("setting_key,setting_value"),
    ]);
  if (
    !tasksResult.error &&
    tasksResult.data
  ) {
    tasks =
      tasksResult.data;
  }
  if (
    !imagesResult.error &&
    imagesResult.data
  ) {
    images =
      imagesResult.data;
  }

  const settings = Object.fromEntries(
    (settingsResult.data || []).map((item) => [
      item.setting_key,
      item.setting_value || "",
    ])
  );
  const whatsapp = settings.whatsapp || settings.phone || "";
  const projectWhatsappUrl = whatsapp
    ? whatsappUrl(
        whatsapp,
        `Bonjour CREDESS Construction, je souhaite vous contacter concernant le projet : ${project.title}.`
      )
    : "/#contact";
  /*
   * Tous les fichiers de la nouvelle galerie
   * sont regroupés automatiquement.
   *
   * Cette logique reste compatible avec
   * les anciens projets ayant plusieurs rubriques.
   */
  const groupedSections =
    new Map<
      string,
      {
        key: string;
        label: string;
        images:
          GalleryImage[];
        order: number;
      }
    >();
  images.forEach(
    (
      image,
      fallbackIndex
    ) => {
      const label =
        image.section_label ||
        image.stage_type ||
        image.label ||
        "Images complètes du projet";
      const key =
        image.section_key ||
        image.stage_type ||
        image.label ||
        "images-completes-du-projet";
      const order =
        typeof image.sort_order ===
        "number"
          ? image.sort_order
          : fallbackIndex;
      if (
        !groupedSections.has(
          key
        )
      ) {
        groupedSections.set(
          key,
          {
            key,
            label,
            images: [],
            order,
          }
        );
      }
      groupedSections
        .get(key)!
        .images
        .push({
          id:
            String(
              image.id ||
              `${key}-${fallbackIndex}`
            ),
          image_url:
            image.image_url,
          label:
            image.label ||
            label,
          description:
            image.description ||
            null,
        });
    }
  );
  const sections =
    Array.from(
      groupedSections
        .values()
    )
      .sort(
        (a, b) =>
          a.order -
          b.order
      );
  const informations = [
    {
      label:
        "TYPE",
      value:
        project.project_type ||
        "À renseigner",
    },
    {
      label:
        "STATUT",
      value:
        project.status ||
        "Réalisé",
    },
    {
      label:
        "ANNÉE",
      value:
        project.year ||
        "À renseigner",
    },
    {
      label:
        "LOCALISATION",
      value:
        project.location ||
        "À renseigner",
    },
    {
      label:
        "CLIENT",
      value:
        project.client_name ||
        "Client privé",
    },
    {
      label:
        "SURFACE",
      value:
        project.surface ||
        "À renseigner",
    },
  ];
  return (
    <main
      className={
        styles.page
      }
      id="top"
    >
      <header
        className={
          styles.header
        }
      >
        <Link
          href="/"
          className={
            styles.brand
          }
        >
          <span
            className={
              styles.brandMark
            }
          >
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>
              CREDESS
            </strong>
            <small>
              CONSTRUCTION
            </small>
          </span>
        </Link>
        <Link
          href="/#realisations"
          className={
            styles.back
          }
        >
          ← Nos réalisations
        </Link>
      </header>
      {/* ===================================================
          COUVERTURE
      ==================================================== */}
      <section
        className={
          styles.hero
        }
      >
        {project.cover_url ? (
          <img
            src={
              project.cover_url
            }
            alt={
              project.title
            }
            className={
              styles.heroImage
            }
          />
        ) : (
          <div
            className={
              styles.heroFallback
            }
          >
            CREDESS
          </div>
        )}
        <div
          className={
            styles.heroOverlay
          }
        />
        <div
          className={
            styles.heroContent
          }
        >
          <span>
            {project.category ||
              "CREDESS CONSTRUCTION"}
          </span>
          <h1>
            {project.title}
          </h1>
          {project.location && (
            <p>
              {project.location}
            </p>
          )}
        </div>
      </section>
      {/* ===================================================
          INFORMATIONS
      ==================================================== */}
      <section
        className={
          styles.infoSection
        }
      >
        <div
          className={
            styles.infoGrid
          }
        >
          {informations.map(
            (
              information
            ) => (
              <article
                key={
                  information.label
                }
              >
                <small>
                  {information.label}
                </small>
                <strong>
                  {information.value}
                </strong>
              </article>
            )
          )}
        </div>
      </section>
      {/* ===================================================
          EVOLUTION DU PROJET
          MAINTENANT AVANT A PROPOS
      ==================================================== */}
      <section
        className={
          styles.evolution
        }
      >
        <div
          className={
            styles.evolutionHeading
          }
        >
          <small>
            ÉVOLUTION DU PROJET
          </small>
          <h2>
            Du plan à la réalisation
          </h2>
          
        </div>
        {sections.length > 0 ? (
          <div
            className={
              styles.galleryList
            }
          >
            {sections.map(
              (
                section
              ) => (
                <ProjectGallery
                  key={
                    section.key
                  }
                  title={
                    section.label
                  }
                  images={
                    section.images
                  }
                />
              )
            )}
          </div>
        ) : (
          <div
            className={
              styles.noEvolution
            }
          >
            <strong>
              Les images du projet
              n'ont pas encore été ajoutées.
            </strong>
          </div>
        )}
      </section>
      {/* ===================================================
          A PROPOS
          MAINTENANT APRES LES PHOTOS
      ==================================================== */}
      <section
        className={
          styles.about
        }
      >
        <small>
          LE PROJET
        </small>
        <h2>
          À propos de cette réalisation
        </h2>
        <p>
          {project.description ||
            "Les informations détaillées de cette réalisation seront prochainement complétées par CREDESS Construction."}
        </p>
      </section>
      {/* ===================================================
          TRAVAUX
      ==================================================== */}
      {tasks.length > 0 && (
        <section
          className={
            styles.tasks
          }
        >
          <div
            className={
              styles.sectionHeadingDark
            }
          >
            <small>
              NOTRE INTERVENTION
            </small>
            <h2>
              Travaux réalisés
            </h2>
          </div>
          <div
            className={
              styles.taskList
            }
          >
            {tasks.map(
              (
                task,
                index
              ) => (
                <article
                  key={
                    task.id ||
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
                  <strong>
                    {task.title}
                  </strong>
                </article>
              )
            )}
          </div>
        </section>
      )}
      {/* ===================================================
          CONTACT
      ==================================================== */}
      <section
        className={
          styles.contact
        }
      >
        <small>
          VOUS AVEZ UN PROJET ?
        </small>
        <h2>
          Construisons le vôtre.
        </h2>
        <div>
          <Link
            href="/devis"
          >
            Demander un devis
            <span>
              →
            </span>
          </Link>
          <a
            href={projectWhatsappUrl}
            target={whatsapp ? "_blank" : undefined}
            rel={whatsapp ? "noopener noreferrer" : undefined}
          >
            Nous contacter
            <span>
              →
            </span>
          </a>
        </div>
      </section>
      <a
        href="#top"
        className={
          styles.toTop
        }
        aria-label="Retour en haut"
      >
        ↑
      </a>
    </main>
  );
}