export const MAX_NICKNAME_LENGTH = 30;

const BLOCKED_NICKNAME_TERMS = [
  "hpta",
  "hp",
  "gonorrea",
  "marica",
  "idiota",
  "imbecil",
  "estupido",
  "pendejo",
  "mierda",
  "puta",
  "puto",
  "sexo",
  "sexual",
  "porn",
  "porno",
  "xxx",
  "onlyfans",
  "nudes",
  "nude",
  "tet",
  "teta",
  "pene",
  "vagina",
  "culo",
  "verga",
  "pito",
  "monda",
];

const toModerationForm = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[013457@$]/g, (char) => {
      if (char === "0") return "o";
      if (char === "1") return "i";
      if (char === "3") return "e";
      if (char === "4") return "a";
      if (char === "5" || char === "$") return "s";
      if (char === "7") return "t";
      if (char === "@") return "a";
      return char;
    })
    .replace(/[^a-z0-9]/g, "");

export const getNicknameValidationError = (nicknameRaw: string) => {
  const nickname = String(nicknameRaw || "").trim();

  if (nickname.length < 3) {
    return "El nickname debe tener mínimo 3 caracteres.";
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return `El nickname no puede superar ${MAX_NICKNAME_LENGTH} caracteres.`;
  }
  if (/\s/.test(nickname)) {
    return "El nickname no puede tener espacios.";
  }

  const normalized = toModerationForm(nickname);
  const isBlocked = BLOCKED_NICKNAME_TERMS.some((term) => normalized.includes(term));
  if (isBlocked) {
    return "Ese nickname no está permitido por contenido ofensivo o sexual.";
  }

  return "";
};
