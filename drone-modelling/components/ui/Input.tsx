import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export default function Input({ label, id, className = "", ...rest }: Props) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        id={id}
        className={`h-11 rounded-lg border border-black/[.08] bg-transparent px-3.5 outline-none focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/30 ${className}`}
        {...rest}
      />
    </label>
  );
}
