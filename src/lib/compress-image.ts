import imageCompression from "browser-image-compression";
export type CompressionResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
  reduction: number;
};
export async function compressProjectImage(
  originalFile: File
): Promise<CompressionResult> {
  const originalSize =
    originalFile.size;
  /*
   * Réglage CREDESS :
   *
   * maxSizeMB = 0.25
   * environ 250 Ko maximum
   *
   * maxWidthOrHeight = 1600
   * suffisant pour téléphone,
   * tablette et ordinateur.
   *
   * WebP réduit fortement le poids.
   */
  const compressedBlob =
    await imageCompression(
      originalFile,
      {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.72,
        alwaysKeepResolution: false,
      }
    );
  /*
   * On force un vrai nom .webp
   */
  const originalName =
    originalFile.name
      .replace(
        /\.[^/.]+$/,
        ""
      );
  const compressedFile =
    new File(
      [compressedBlob],
      `${originalName}.webp`,
      {
        type: "image/webp",
        lastModified:
          Date.now(),
      }
    );
  const compressedSize =
    compressedFile.size;
  const reduction =
    originalSize > 0
      ? Math.round(
          (
            1 -
            compressedSize /
              originalSize
          ) *
            100
        )
      : 0;
  return {
    file:
      compressedFile,
    originalSize,
    compressedSize,
    reduction,
  };
}
export function formatImageSize(
  bytes: number
) {
  if (
    bytes <
    1024
  ) {
    return `${bytes} o`;
  }
  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(0)} Ko`;
  }
  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(2)} Mo`;
}