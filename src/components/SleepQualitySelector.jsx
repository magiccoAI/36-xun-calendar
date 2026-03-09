import React, { useMemo, useState } from 'react';

/**
 * @typedef {Object} SleepQualityOption
 * @property {number|string} value - Unique value returned by onSelect.
 * @property {string} label - Text shown for the option.
 * @property {string} [emoji] - Optional emoji icon.
 * @property {string} [description] - Optional short description.
 */

/**
 * @typedef {Object} SleepQualitySelectorProps
 * @property {SleepQualityOption[]} [options]
 * @property {number|string|null} [value] - Controlled selected value.
 * @property {number|string|null} [defaultValue] - Uncontrolled initial value.
 * @property {(value: number|string, option: SleepQualityOption) => void} [onSelect]
 * @property {string} [title]
 * @property {string} [className]
 * @property {boolean} [showSelectionHint]
 */

const DEFAULT_OPTIONS = [
    { value: 5, emoji: '🤩', label: '精神爆棚' },
    { value: 4, emoji: '😊', label: '还不错' },
    { value: 3, emoji: '😐', label: '普通' },
    { value: 2, emoji: '😴', label: '困' },
    { value: 1, emoji: '😵', label: '没恢复' }
];

/**
 * SleepQualitySelector
 * - Single-select recovery status buttons
 * - Responsive horizontal centered layout
 * - Works as controlled or uncontrolled component
 *
 * @param {SleepQualitySelectorProps} props
 */
export default function SleepQualitySelector({
    options = DEFAULT_OPTIONS,
    value,
    defaultValue = null,
    onSelect,
    title = '今日恢复状态',
    className = '',
    showSelectionHint = true
}) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const selectedValue = isControlled ? value : internalValue;

    const selectedOption = useMemo(
        () => options.find(option => option.value === selectedValue) || null,
        [options, selectedValue]
    );

    const handleSelect = (option) => {
        if (!isControlled) {
            setInternalValue(option.value);
        }
        if (typeof onSelect === 'function') {
            onSelect(option.value, option);
        }
    };

    return (
        <section className={`w-full ${className}`.trim()}>
            <h4 className="mb-3 text-xs font-medium text-gray-600">{title}</h4>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
                {options.map((option) => {
                    const isSelected = option.value === selectedValue;

                    return (
                        <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => handleSelect(option)}
                            aria-pressed={isSelected}
                            className={[
                                'min-w-[88px] rounded-xl border px-3 py-2 text-xs sm:text-sm',
                                'transition-all duration-150 ease-out transform',
                                'hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0',
                                'focus:outline-none focus:ring-2 focus:ring-indigo-300',
                                isSelected
                                    ? 'border-indigo-500 bg-indigo-500 text-white shadow-md'
                                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                            ].join(' ')}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                {option.emoji ? <span>{option.emoji}</span> : null}
                                <span>{option.label}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {showSelectionHint ? (
                <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
                    {selectedOption ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                            <span>{selectedOption.emoji || '✅'}</span>
                            <span>已选择：{selectedOption.label}</span>
                        </span>
                    ) : (
                        <span className="text-gray-400">请选择今日恢复状态</span>
                    )}
                </div>
            ) : null}
        </section>
    );
}

export { DEFAULT_OPTIONS };
