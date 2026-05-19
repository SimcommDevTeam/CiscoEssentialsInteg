import clsx from "clsx";

interface BaseFieldProps {
  label: string;
  error?: string;
}

interface TextInputProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

const fieldClass =
  "mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-webex-ink transition placeholder:text-slate-400 focus:border-webex-cyan";

export function TextInput({
  label,
  error,
  value,
  onChange,
  placeholder,
  type = "text"
}: TextInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-webex-ink">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(fieldClass, error ? "border-red-400" : "border-webex-line")}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  error,
  value,
  onChange,
  options,
  placeholder = "Select an option"
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-webex-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(fieldClass, error ? "border-red-400" : "border-webex-line")}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
