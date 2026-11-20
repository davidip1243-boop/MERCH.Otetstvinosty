const GMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i;
const NAME_RE = /^[\p{L}][\p{L}\s'’-]{1,79}$/u;

function normalizePhone(value) {
  const raw = String(value || "").trim().replace(/[\s()\-]/g, "");
  if (/^8\d{10}$/.test(raw)) return `+7${raw.slice(1)}`;
  if (/^7\d{10}$/.test(raw)) return `+${raw}`;
  if (/^\+7\d{10}$/.test(raw)) return raw;
  return null;
}

function validGmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return GMAIL_RE.test(email) && !email.includes("..") && email[0] !== "." && !email.split("@")[0].endsWith(".");
}

function validName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  return NAME_RE.test(name) && (name.match(/[\p{L}]/gu) || []).length >= 2;
}

function validAddress(value) {
  const address = String(value || "").trim().replace(/\s+/g, " ");
  const hasLetters = /\p{L}{2,}/u.test(address);
  const hasHouseNumber = /\b\d{1,5}[а-яa-z]?\b/iu.test(address);
  return address.length >= 10 && address.length <= 240 && hasLetters && hasHouseNumber;
}

function validateCustomer(customer, fulfillmentMethod = "delivery") {
  const errors = {};
  if (!validName(customer?.name)) errors.name = "Введите имя буквами, минимум 2 символа.";
  const phone = normalizePhone(customer?.phone);
  if (!phone) errors.phone = "Введите российский номер: +7 900 000-00-00.";
  if (!validGmail(customer?.email)) errors.email = "Введите действующий адрес Gmail.";
  if (fulfillmentMethod === "delivery" && !validAddress(customer?.address)) errors.address = "Укажите город, улицу и номер дома.";
  return { ok: Object.keys(errors).length === 0, errors, normalized: { ...customer, email: String(customer?.email || "").trim().toLowerCase(), phone } };
}

module.exports = { normalizePhone, validGmail, validName, validAddress, validateCustomer };
