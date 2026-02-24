"use client";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

export default function AmountInput({
  value,
  onChange,
  label,
  disabled,
}: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || /^\d*\.?\d*$/.test(v)) {
      onChange(v);
    }
  };

  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0"
        className="w-full text-3xl font-semibold text-right bg-transparent border-none focus:outline-none text-gray-800 disabled:text-gray-400"
      />
    </div>
  );
}
