import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: (string | [string, string])[];
  placeholder?: string;
}

export const FormInput: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div>
    {label && <label className="input-label">{label}{props.required && <span className="text-red-400 ml-1">*</span>}</label>}
    <input
      {...props}
      className={`input-base ${error ? 'border-red-500/60 focus:border-red-500' : ''} ${className}`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

export const FormTextarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => (
  <div>
    {label && <label className="input-label">{label}{props.required && <span className="text-red-400 ml-1">*</span>}</label>}
    <textarea
      {...props}
      className={`input-base resize-none ${error ? 'border-red-500/60' : ''} ${className}`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

export const FormSelect: React.FC<SelectProps> = ({ label, error, options, placeholder, className = '', ...props }) => (
  <div>
    {label && <label className="input-label">{label}{props.required && <span className="text-red-400 ml-1">*</span>}</label>}
    <select
      {...props}
      className={`input-base ${error ? 'border-red-500/60' : ''} ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) =>
        Array.isArray(o)
          ? <option key={o[0]} value={o[0]}>{o[1]}</option>
          : <option key={o} value={o}>{o}</option>
      )}
    </select>
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);
