// Kategoriyalar — frontend ham shu ro'yxatni /api/categories orqali oladi (yagona manba).
export const CATEGORIES = [
  { id: "pharmacy", name: "Dorixona", emoji: "💊", color: "#16a34a" },
  { id: "hospital", name: "Shifoxona", emoji: "🏥", color: "#dc2626" },
  { id: "bank", name: "Bank/ATM", emoji: "🏦", color: "#2563eb" },
  { id: "food", name: "Restoran", emoji: "🍽️", color: "#ea580c" },
  { id: "cafe", name: "Kafe", emoji: "☕", color: "#a16207" },
  { id: "fuel", name: "Yoqilg'i", emoji: "⛽", color: "#7c3aed" },
  { id: "market", name: "Do'kon", emoji: "🛒", color: "#0891b2" },
  { id: "metro", name: "Metro", emoji: "🚇", color: "#be185d" },
];

export const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
