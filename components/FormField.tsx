import React from 'react';

const inputClass =
  'w-full min-h-[48px] px-3.5 py-2.5 bg-[#181818] border border-white/15 rounded-xl text-white text-base outline-none focus:ring-2 focus:ring-[#E10600]';

export const primaryButtonClass =
  "w-full min-h-[48px] bg-[#E10600] hover:bg-red-700 disabled:opacity-60 text-white font-['Oswald'] uppercase text-base font-bold py-3 px-6 rounded-xl transition-colors";

type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

const FormField: React.FC<FormFieldProps> = ({ label, name, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1.5">
      {label}
    </label>
    <input id={name} name={name} className={inputClass} {...props} />
  </div>
);

export default FormField;
