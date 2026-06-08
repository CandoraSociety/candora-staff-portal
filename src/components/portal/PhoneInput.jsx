import { Input } from '@/components/ui/input';

export default function PhoneInput({ value, onChange, placeholder, className }) {
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleChange = (e) => {
    const formatted = formatPhone(e.target.value);
    onChange({ target: { value: formatted } });
  };

  return (
    <Input
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder || "(555) 555-5555"}
      maxLength={14}
      className={className}
    />
  );
}