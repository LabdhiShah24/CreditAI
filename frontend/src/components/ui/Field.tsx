import React from 'react';
import { cx } from '../../utils/format';

const controlBase =
'w-full rounded-2xl border border-navy-200 bg-white px-4 text-[1.05rem] text-navy-900 placeholder:text-navy-300 transition-[border-color,box-shadow] duration-150 ease-out hover:border-navy-300 focus:border-ai-500 focus:outline-none focus:ring-4 focus:ring-ai-100';

interface FieldShellProps {
  id: string;
  label: string;
  helper?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldShell({
  id,
  label,
  helper,
  children,
  className
}: FieldShellProps) {
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label
        htmlFor={id}
        className="text-[0.98rem] font-semibold text-navy-700">
        
        {label}
      </label>
      {children}
      {helper ?
      <p className="text-[0.92rem] leading-snug text-navy-400">{helper}</p> :
      null}
    </div>);

}

interface TextFieldProps extends
  React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  helper?: string;
  prefix?: string;
  suffix?: string;
  wrapperClassName?: string;
}

export function TextField({
  id,
  label,
  helper,
  prefix,
  suffix,
  wrapperClassName,
  className,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} helper={helper} className={wrapperClassName}>
      <div className="relative">
        {prefix ?
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[1.05rem] font-semibold text-navy-400">
            {prefix}
          </span> :
        null}
        <input
          id={id}
          name={id}
          className={cx(
            controlBase,
            'h-14',
            prefix && 'pl-9',
            suffix && 'pr-20',
            className
          )}
          {...rest} />
        
        {suffix ?
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.95rem] font-medium text-navy-400">
            {suffix}
          </span> :
        null}
      </div>
    </FieldShell>);

}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  helper?: string;
  options: string[];
  placeholder?: string;
  wrapperClassName?: string;
}

export function SelectField({
  id,
  label,
  helper,
  options,
  placeholder,
  wrapperClassName,
  className,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} helper={helper} className={wrapperClassName}>
      <select
        id={id}
        name={id}
        defaultValue=""
        className={cx(controlBase, 'h-14 appearance-none pr-10', className)}
        style={{
          backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364789E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center'
        }}
        {...rest}>
        
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) =>
        <option key={option} value={option}>
            {option}
          </option>
        )}
      </select>
    </FieldShell>);
}