export function normalizePhone(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return value.replace(/[^0-9]/g, "");
}


export function whatsappUrl(
  phone?: string | null,
  message?: string
) {
  const number =
    normalizePhone(phone) ||
    "243971092275";

  const base =
    "https://wa.me/" + number;

  if (!message) {
    return base;
  }

  return (
    base +
    "?text=" +
    encodeURIComponent(message)
  );
}
