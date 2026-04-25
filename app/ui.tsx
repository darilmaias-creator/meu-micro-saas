/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border border-slate-200 ${className}`}>
        {children}
    </div>
);

export const sanitizeDecimalInput = (rawValue: string) => {
    let value = rawValue;
    if (value.includes(',')) {
        value = value.split('.').join('');
        value = value.replace(',', '.');
    }
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    return value;
};

export const sanitizeIntegerInput = (rawValue: string) => rawValue.replace(/[^0-9]/g, '');

export const InputGroup = ({ label, value, onChange, prefix = "", suffix = "", type = "number", step = "0.01", tooltip = "", className="", placeholder="", disabled = false }: any) => {
    const handleChange = (e: any) => {
        if (disabled) return;
        const rawValue = e.target.value;
        if (type === 'number') {
            onChange(sanitizeDecimalInput(rawValue));
        } else {
            onChange(rawValue);
        }
    };

    return (
        <div className={`mb-4 ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                {tooltip && (
                    <div className="group relative">
                        <Info size={14} className="text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded z-10 text-center shadow-lg">{tooltip}</div>
                    </div>
                )}
            </div>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
                <input
                    type={type === 'number' ? 'text' : type}
                    inputMode={type === 'number' ? 'decimal' : undefined}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder={placeholder || "0.00"}
                    className={`w-full p-2 border rounded-lg outline-none transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} ${disabled ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed' : 'border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'}`}
                />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>}
            </div>
        </div>
    );
};

export const TimeInputGroup = ({ label, totalMinutes, onChange, tooltip }: any) => {
    const safeMinutes = Number(totalMinutes) || 0;
    const hours = Math.floor(safeMinutes / 60);
    const minutes = Math.round(safeMinutes % 60);
    const [hoursInput, setHoursInput] = useState(String(hours));
    const [minutesInput, setMinutesInput] = useState(String(minutes));

    useEffect(() => {
        const nextHours = String(hours);
        const nextMinutes = String(minutes);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHoursInput((current: string) => current === nextHours ? current : nextHours);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMinutesInput((current: string) => current === nextMinutes ? current : nextMinutes);
    }, [hours, minutes]);

    const commitTimeChange = (nextHoursRaw: string, nextMinutesRaw: string) => {
        const nextHours = nextHoursRaw === '' ? 0 : Number(nextHoursRaw);
        const nextMinutes = nextMinutesRaw === '' ? 0 : Math.min(59, Number(nextMinutesRaw));
        onChange((nextHours * 60) + nextMinutes);
    };

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                {tooltip && <div className="group relative"><Info size={14} className="text-slate-400 cursor-help" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded z-10 text-center shadow-lg">{tooltip}</div></div>}
            </div>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={hoursInput}
                        onChange={(e) => {
                            const nextValue = sanitizeIntegerInput(e.target.value);
                            setHoursInput(nextValue);
                            if (nextValue !== '') {
                                commitTimeChange(nextValue, minutesInput);
                            }
                        }}
                        onBlur={() => {
                            const normalizedValue = hoursInput === '' ? '0' : hoursInput;
                            setHoursInput(normalizedValue);
                            commitTimeChange(normalizedValue, minutesInput);
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-center"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">h</span>
                </div>
                <span className="text-slate-400 font-bold">:</span>
                <div className="relative flex-1">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={minutesInput}
                        onChange={(e) => {
                            const nextValue = sanitizeIntegerInput(e.target.value);
                            const normalizedValue = nextValue === '' ? '' : String(Math.min(59, Number(nextValue)));
                            setMinutesInput(normalizedValue);
                            if (normalizedValue !== '') {
                                commitTimeChange(hoursInput, normalizedValue);
                            }
                        }}
                        onBlur={() => {
                            const normalizedValue = minutesInput === '' ? '0' : String(Math.min(59, Number(minutesInput)));
                            setMinutesInput(normalizedValue);
                            commitTimeChange(hoursInput, normalizedValue);
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-center"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">min</span>
                </div>
            </div>
        </div>
    );
};

export const Toggle = ({ label, checked, onChange, tooltip }: any) => (
    <div className="mb-4 flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100">
        <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-amber-800">{label}</label>
            {tooltip && <div className="group relative"><Info size={14} className="text-amber-500 cursor-help" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded z-10 text-center shadow-lg">{tooltip}</div></div>}
        </div>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 transition-all duration-300 ease-in-out left-0" style={{ left: checked ? '100%' : '0', transform: checked ? 'translateX(-100%)' : 'translateX(0)', borderColor: checked ? '#f59e0b' : '#cbd5e1' }} />
            <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${checked ? 'bg-amber-400' : 'bg-slate-300'}`}></label>
        </div>
    </div>
);
