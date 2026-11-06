export const agendaTimeZone = "America/Sao_Paulo";

const dateTimeInput = new Intl.DateTimeFormat("sv-SE", {
  timeZone: agendaTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const zoneOffset = new Intl.DateTimeFormat("en", { timeZone: agendaTimeZone, timeZoneName: "longOffset" });

export function asAgendaInput(instant: string) {
  return dateTimeInput.format(new Date(instant)).replace(" ", "T");
}

export function fromAgendaInput(value: string) {
  const approximate = new Date(value + "Z");
  const offset = zoneOffset.formatToParts(approximate).find((part) => part.type === "timeZoneName")?.value;
  return new Date(value + (offset?.slice(3) || "Z")).toISOString();
}

export const appointmentTypes: Record<string, string> = {
  TechnicalVisit: "Visita técnica", Measurement: "Medição", Installation: "Instalação", Other: "Outro",
};

export function formatAgendaTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: agendaTimeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
