// 🔥 Substitua a função safeFormatDate por esta:
const safeFormatDateTime = (dateStr: string) => {
  if (!dateStr) return "Data inválida";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return "Data inválida";
  }
};

// E use safeFormatDateTime em vez de safeFormatDate para check_in e check_out
