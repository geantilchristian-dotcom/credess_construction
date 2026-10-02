"use client";
import {
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from
  "./ProjectGallery.module.css";
export type GalleryImage = {
  id: string;
  image_url: string;
  label?: string | null;
  description?: string | null;
};
type Props = {
  title: string;
  images: GalleryImage[];
};
export default function ProjectGallery({
  title,
  images,
}: Props) {
  const [
    index,
    setIndex,
  ] =
    useState(0);
  const [
    lightboxOpen,
    setLightboxOpen,
  ] =
    useState(false);
  const startX =
    useRef<number | null>(
      null
    );
  function previous() {
    setIndex(
      (current) =>
        current === 0
          ? images.length - 1
          : current - 1
    );
  }
  function next() {
    setIndex(
      (current) =>
        current ===
        images.length - 1
          ? 0
          : current + 1
    );
  }
  useEffect(() => {
    if (
      !lightboxOpen
    ) {
      return;
    }
    const previousOverflow =
      document.body.style
        .overflow;
    document.body.style
      .overflow =
      "hidden";
    function handleKeyboard(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setLightboxOpen(
          false
        );
      }
      if (
        event.key ===
        "ArrowLeft"
      ) {
        previous();
      }
      if (
        event.key ===
        "ArrowRight"
      ) {
        next();
      }
    }
    window.addEventListener(
      "keydown",
      handleKeyboard
    );
    return () => {
      document.body.style
        .overflow =
        previousOverflow;
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    lightboxOpen,
    images.length,
  ]);
  if (
    images.length === 0
  ) {
    return null;
  }
  const current =
    images[index];
  function pointerDown(
    event:
      PointerEvent<HTMLDivElement>
  ) {
    startX.current =
      event.clientX;
  }
  function pointerUp(
    event:
      PointerEvent<HTMLDivElement>
  ) {
    if (
      startX.current ===
      null
    ) {
      return;
    }
    const difference =
      event.clientX -
      startX.current;
    startX.current =
      null;
    if (
      Math.abs(
        difference
      ) <
      45
    ) {
      return;
    }
    if (
      difference > 0
    ) {
      previous();
    }
    else {
      next();
    }
  }
  return (
    <>
      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.heading
          }
        >
          <div>
            
            <h3>
              {title}
            </h3>
          </div>
          <span>
            {index + 1}
            {" / "}
            {images.length}
          </span>
        </div>
        <div
          className={
            styles.viewer
          }
          onPointerDown={
            pointerDown
          }
          onPointerUp={
            pointerUp
          }
        >
          <button
            type="button"
            className={
              styles.mainImageButton
            }
            onClick={() =>
              setLightboxOpen(
                true
              )
            }
            aria-label="Agrandir la photo"
          >
            <img
              src={
                current.image_url
              }
              alt={
                current.label ||
                title
              }
              loading="lazy"
              draggable={
                false
              }
            />
            <span
              className={
                styles.zoomHint
              }
            >
              ⛶ Agrandir
            </span>
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className={
                  styles.previous
                }
                onClick={(
                  event
                ) => {
                  event.stopPropagation();
                  previous();
                }}
                aria-label="Photo précédente"
              >
                ‹
              </button>
              <button
                type="button"
                className={
                  styles.next
                }
                onClick={(
                  event
                ) => {
                  event.stopPropagation();
                  next();
                }}
                aria-label="Photo suivante"
              >
                ›
              </button>
            </>
          )}
          <div
            className={
              styles.counter
            }
          >
            {String(
              index + 1
            ).padStart(
              2,
              "0"
            )}
            {" / "}
            {String(
              images.length
            ).padStart(
              2,
              "0"
            )}
          </div>
        </div>
        {current.description && (
          <p
            className={
              styles.description
            }
          >
            {current.description}
          </p>
        )}
        {images.length > 1 && (
          <div
            className={
              styles.thumbnails
            }
          >
            {images.map(
              (
                image,
                imageIndex
              ) => (
                <button
                  type="button"
                  key={
                    image.id
                  }
                  className={
                    imageIndex ===
                    index
                      ? styles.thumbnailActive
                      : styles.thumbnail
                  }
                  onClick={() =>
                    setIndex(
                      imageIndex
                    )
                  }
                >
                  <img
                    src={
                      image.image_url
                    }
                    alt=""
                    loading="lazy"
                  />
                </button>
              )
            )}
          </div>
        )}
        {images.length > 1 && (
          <div
            className={
              styles.dots
            }
          >
            {images.map(
              (
                image,
                imageIndex
              ) => (
                <button
                  type="button"
                  key={
                    `dot-${image.id}`
                  }
                  className={
                    imageIndex ===
                    index
                      ? styles.dotActive
                      : styles.dot
                  }
                  onClick={() =>
                    setIndex(
                      imageIndex
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </section>
      {/* =====================================================
          AGRANDISSEMENT PHOTO
      ====================================================== */}
      {lightboxOpen && (
        <div
          className={
            styles.lightbox
          }
          role="dialog"
          aria-modal="true"
          onClick={() =>
            setLightboxOpen(
              false
            )
          }
        >
          <button
            type="button"
            className={
              styles.lightboxClose
            }
            onClick={() =>
              setLightboxOpen(
                false
              )
            }
          >
            ×
          </button>
          <div
            className={
              styles.lightboxContent
            }
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <img
              src={
                current.image_url
              }
              alt={
                current.label ||
                title
              }
              draggable={
                false
              }
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={
                    styles.lightboxPrevious
                  }
                  onClick={
                    previous
                  }
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={
                    styles.lightboxNext
                  }
                  onClick={
                    next
                  }
                >
                  ›
                </button>
              </>
            )}
            <div
              className={
                styles.lightboxCounter
              }
            >
              {index + 1}
              {" / "}
              {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}