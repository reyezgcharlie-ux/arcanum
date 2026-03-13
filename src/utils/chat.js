export const getChatId = (a, b) => [a, b].sort().join("_");

export const formatTime = (date) => {
  if (!date) return "";
  const now  = new Date();
  const diff = now - date;
  if (diff < 86400000) return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return date.toLocaleDateString("es", { weekday: "short" });
  return date.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
};

export const formatDate = (date) => {
  if (!date) return "";
  const now  = new Date();
  const diff = now - date;
  if (diff < 86400000) return "Hoy";
  if (diff < 172800000) return "Ayer";
  return date.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
};
