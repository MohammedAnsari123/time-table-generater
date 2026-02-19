import React from 'react';

export const TextInput = ({ label, value, onChange, placeholder, required = false, type = "text" }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            placeholder={placeholder}
            required={required}
        />
    </div>
);

export const SelectInput = ({ label, value, onChange, options, required = false }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
            required={required}
        >
            <option value="" disabled>Select {label}</option>
            {options.map((opt, idx) => (
                <option key={idx} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

export const NumberInput = ({ label, value, onChange, min = 0, max, required = false }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            required={required}
        />
    </div>
);
