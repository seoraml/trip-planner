export interface TripFormValues {
  title: string;
  country: string;
  city: string;
  startDate: string; // "YYYY-MM-DD" from <input type="date">
  endDate: string;
  description: string;
}

export type TripFormErrors = Partial<Record<keyof TripFormValues, string>>;

export const initialTripFormValues: TripFormValues = {
  title: "",
  country: "",
  city: "",
  startDate: "",
  endDate: "",
  description: "",
};

export function validateTripForm(values: TripFormValues): TripFormErrors {
  const errors: TripFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "여행 제목을 입력해주세요.";
  }
  if (!values.country.trim()) {
    errors.country = "국가를 입력해주세요.";
  }
  if (!values.city.trim()) {
    errors.city = "도시를 입력해주세요.";
  }
  if (!values.startDate) {
    errors.startDate = "시작일을 선택해주세요.";
  }
  if (!values.endDate) {
    errors.endDate = "종료일을 선택해주세요.";
  }
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "종료일은 시작일보다 빠를 수 없습니다.";
  }

  return errors;
}
