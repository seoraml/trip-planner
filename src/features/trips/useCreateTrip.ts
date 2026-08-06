import { useState } from "react";
import type { Trip } from "@/types/domain";
import {
  initialTripFormValues,
  validateTripForm,
  type TripFormValues,
  type TripFormErrors,
} from "./tripFormValidation";
import { createTrip } from "./tripService";

export type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function useCreateTrip() {
  const [values, setValues] = useState<TripFormValues>(initialTripFormValues);
  const [touched, setTouched] = useState<Partial<Record<keyof TripFormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allErrors = validateTripForm(values);
  const visibleErrors: TripFormErrors = {};
  for (const key of Object.keys(allErrors) as (keyof TripFormValues)[]) {
    if (touched[key] || submitAttempted) {
      visibleErrors[key] = allErrors[key];
    }
  }

  function setField(field: keyof TripFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function blurField(field: keyof TripFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function submit(): Promise<Trip | null> {
    setSubmitAttempted(true);

    if (Object.keys(validateTripForm(values)).length > 0) {
      return null;
    }
    if (status === "submitting") {
      return null;
    }

    setStatus("submitting");
    setSubmitError(null);
    try {
      const trip = await createTrip(values);
      setStatus("success");
      return trip;
    } catch (error) {
      setStatus("error");
      setSubmitError(
        error instanceof Error ? error.message : "여행을 저장하지 못했습니다. 다시 시도해주세요."
      );
      return null;
    }
  }

  return { values, errors: visibleErrors, status, submitError, setField, blurField, submit };
}
