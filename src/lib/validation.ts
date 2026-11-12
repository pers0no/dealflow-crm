import { OPEN_STAGES, type DealInput } from "./types";

export type FormValues = Omit<DealInput, "value"> & { value: string };
export type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDeal(v: FormValues, today: string): FormErrors {
  const errors: FormErrors = {};
  if (!v.company.trim()) errors.company = "Company is required.";
  if (!v.contact.trim()) errors.contact = "Contact name is required.";
  if (!v.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = "Enter a valid email address.";

  const amount = Number(v.value.replace(/[$,\s]/g, ""));
  if (!v.value.trim()) errors.value = "Deal value is required.";
  else if (!Number.isFinite(amount) || amount <= 0) errors.value = "Enter an amount greater than $0.";
  else if (amount > 100_000_000) errors.value = "That looks too large — max is $100M.";

  if (!v.closeDate) errors.closeDate = "Pick a close date.";
  else if (!OPEN_STAGES.includes(v.stage) && v.closeDate > today)
    errors.closeDate = "Won and lost deals can’t close in the future.";

  return errors;
}

/** Converts validated form values into the shape stored in state. */
export function toDealInput(v: FormValues): DealInput {
  return {
    ...v,
    company: v.company.trim(),
    contact: v.contact.trim(),
    email: v.email.trim().toLowerCase(),
    notes: v.notes.trim(),
    value: Math.round(Number(v.value.replace(/[$,\s]/g, ""))),
  };
}
