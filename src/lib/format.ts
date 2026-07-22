export const formatNaira = (n: number | string | null | undefined): string => {
  const num = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (!Number.isFinite(num)) return "₦0.00";
  return "₦" + num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatInt = (n: number | string | null | undefined): string => {
  const num = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return Math.round(num).toLocaleString("en-NG");
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);
