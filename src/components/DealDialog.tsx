"use client";

import { Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { formatDate } from "@/lib/format";
import { addDays } from "@/lib/dates";
import { OPEN_STAGES, OWNERS, SOURCES, STAGES, type Deal, type DealInput, type ISODate, type Stage } from "@/lib/types";
import { toDealInput, validateDeal, type FormErrors, type FormValues } from "@/lib/validation";
import { Button } from "./ui";

interface Props {
  deal: Deal | null; // null = create mode
  today: ISODate;
  onSave: (input: DealInput) => void;
  onDelete?: (deal: Deal) => void;
  onClose: () => void;
}

function initialValues(deal: Deal | null, today: ISODate): FormValues {
  if (deal) return { ...deal, value: String(deal.value) };
  return {
    company: "",
    contact: "",
    email: "",
    value: "",
    stage: "Lead",
    owner: OWNERS[0],
    source: "Inbound",
    closeDate: addDays(today, 30),
    notes: "",
  };
}

const FIELD_ORDER: (keyof FormValues)[] = ["company", "contact", "email", "value", "closeDate"];

const inputClass = (invalid: boolean) =>
  `h-9 w-full rounded-lg border bg-card px-3 text-sm text-ink shadow-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring ${
    invalid ? "border-critical" : "border-line-strong"
  }`;

/**
 * Add / edit form in a native <dialog>: the browser handles focus trapping,
 * Esc-to-close and the inert background for free.
 */
export function DealDialog({ deal, today, onSave, onDelete, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const [values, setValues] = useState<FormValues>(() => initialValues(deal, today));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const isEdit = deal !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // showModal() focuses the first focusable element (the close button); start on the first field instead.
    formRef.current?.querySelector<HTMLInputElement>('[name="company"]')?.focus();
  }, []);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    const next = { ...values, [key]: value };
    // Closing a deal: a future close date makes no sense, snap it to today.
    if (key === "stage" && !OPEN_STAGES.includes(value as Stage) && next.closeDate > today) {
      next.closeDate = today;
    }
    setValues(next);
    // After the first submit attempt, re-validate live so errors clear as the user fixes them.
    if (submitted) setErrors(validateDeal(next, today));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateDeal(values, today);
    setSubmitted(true);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    onSave(toDealInput(values));
  };

  const field = (name: keyof FormValues, label: string, input: React.ReactNode, className = "") => (
    <div className={className}>
      <label htmlFor={`${uid}-${name}`} className="mb-1 block text-sm font-medium text-ink-2">
        {label}
      </label>
      {input}
      {errors[name] && (
        <p id={`${uid}-${name}-error`} className="mt-1 text-xs text-critical">
          {errors[name]}
        </p>
      )}
    </div>
  );

  const textProps = (name: keyof FormValues) => ({
    id: `${uid}-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${uid}-${name}-error` : undefined,
    className: inputClass(Boolean(errors[name])),
  });

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel) closes it.
        if (e.target === dialogRef.current) dialogRef.current.close();
      }}
      aria-labelledby={`${uid}-title`}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-line bg-card p-0 text-ink shadow-2xl"
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={`${uid}-title`} className="text-base font-semibold">
              {isEdit ? "Edit deal" : "New deal"}
            </h2>
            <p className="text-sm text-muted">
              {isEdit ? `Created ${formatDate(deal.createdAt)}` : "Add an opportunity to your pipeline."}
            </p>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close" onClick={() => dialogRef.current?.close()}>
            <X className="size-4" />
          </Button>
        </header>

        <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
          {field(
            "company",
            "Company",
            <input {...textProps("company")} value={values.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Corp" />,
            "sm:col-span-2",
          )}
          {field(
            "contact",
            "Contact name",
            <input {...textProps("contact")} value={values.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Jane Doe" autoComplete="off" />,
          )}
          {field(
            "email",
            "Email",
            <input {...textProps("email")} type="email" value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@acme.com" autoComplete="off" />,
          )}
          {field(
            "value",
            "Deal value (USD)",
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
              <input
                {...textProps("value")}
                className={`${inputClass(Boolean(errors.value))} pl-6 tabular-nums`}
                inputMode="decimal"
                value={values.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder="25,000"
              />
            </div>,
          )}
          {field(
            "closeDate",
            OPEN_STAGES.includes(values.stage) ? "Expected close" : "Closed on",
            <input {...textProps("closeDate")} type="date" value={values.closeDate} onChange={(e) => set("closeDate", e.target.value)} />,
          )}
          {field(
            "stage",
            "Stage",
            <select {...textProps("stage")} value={values.stage} onChange={(e) => set("stage", e.target.value as Stage)}>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>,
          )}
          {field(
            "owner",
            "Owner",
            <select {...textProps("owner")} value={values.owner} onChange={(e) => set("owner", e.target.value)}>
              {OWNERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>,
          )}
          {field(
            "source",
            "Lead source",
            <select {...textProps("source")} value={values.source} onChange={(e) => set("source", e.target.value as FormValues["source"])}>
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>,
            "sm:col-span-2",
          )}
          {field(
            "notes",
            "Notes",
            <textarea
              {...textProps("notes")}
              className={`${inputClass(false)} h-20 resize-y py-2`}
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Next steps, decision makers, blockers…"
            />,
            "sm:col-span-2",
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          {isEdit && onDelete ? (
            <Button variant="danger" onClick={() => onDelete(deal)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={() => dialogRef.current?.close()}>Cancel</Button>
            <Button type="submit" variant="primary">
              {isEdit ? "Save changes" : "Add deal"}
            </Button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
