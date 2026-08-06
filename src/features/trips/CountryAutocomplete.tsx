import { useMemo, useState, type ChangeEvent, type FocusEvent } from "react";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  placeholder?: string;
}

export function CountryAutocomplete({ id, value, onChange, onBlur, placeholder, ...rest }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => {
    const query = value.trim();
    if (!query) return [];
    return COUNTRIES.filter((country) => country.includes(query)).slice(0, 8);
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    setIsOpen(true);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setIsOpen(false);
    onBlur?.();
    void event;
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        {...rest}
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {suggestions.map((country) => (
            <li key={country}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(country);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
              >
                {country}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
