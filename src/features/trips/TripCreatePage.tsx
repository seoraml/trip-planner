import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTrip } from "./useCreateTrip";
import type { TripFormValues } from "./tripFormValidation";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export function TripCreatePage() {
  const navigate = useNavigate();
  const { values, errors, status, submitError, setField, blurField, submit } = useCreateTrip();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trip = await submit();
    if (trip) {
      navigate(`/trip/${trip.shareSlug}`);
    }
  }

  function fieldProps(field: keyof TripFormValues) {
    const errorId = `${field}-error`;
    return {
      id: field,
      value: values[field],
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setField(field, event.target.value),
      onBlur: () => blurField(field),
      "aria-invalid": !!errors[field],
      "aria-describedby": errors[field] ? errorId : undefined,
    };
  }

  const isSubmitting = status === "submitting";

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-slate-900">새 여행 만들기</h1>
      <p className="mt-2 text-slate-500">여행 제목과 기간을 입력해 일정을 시작하세요.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">
            여행 제목
            <RequiredMark />
          </Label>
          <Input placeholder="예: 오사카 벚꽃 여행" {...fieldProps("title")} />
          <FieldError id="title-error" message={errors.title} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">
              국가
              <RequiredMark />
            </Label>
            <Input placeholder="예: 일본" {...fieldProps("country")} />
            <FieldError id="country-error" message={errors.country} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">
              도시
              <RequiredMark />
            </Label>
            <Input placeholder="예: 오사카" {...fieldProps("city")} />
            <FieldError id="city-error" message={errors.city} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">
              시작일
              <RequiredMark />
            </Label>
            <Input type="date" {...fieldProps("startDate")} />
            <FieldError id="startDate-error" message={errors.startDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">
              종료일
              <RequiredMark />
            </Label>
            <Input type="date" {...fieldProps("endDate")} />
            <FieldError id="endDate-error" message={errors.endDate} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">여행 설명 (선택)</Label>
          <Textarea
            placeholder="이번 여행에 대한 간단한 메모를 남겨보세요."
            rows={4}
            {...fieldProps("description")}
          />
          <FieldError id="description-error" message={errors.description} />
        </div>

        {status === "error" && submitError && (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "저장 중..." : "여행 만들기"}
        </Button>
      </form>
    </main>
  );
}
