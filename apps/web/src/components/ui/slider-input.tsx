import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface SliderInputProps {
    label: string
    value: number
    onChange: (value: number) => void
    min: number
    max: number
    step: number
    symbol?: string
    suffix?: string
    className?: string
    disabled?: boolean
}

export function SliderInput({
    label,
    value,
    onChange,
    min,
    max,
    step,
    symbol,
    suffix,
    className,
    disabled = false
}: SliderInputProps) {

    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState("");

    // Sync external value changes into local visual string when not actively typing
    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            if (suffix === "%") {
                setLocalValue(value === 0 ? "" : value.toString());
            } else {
                setLocalValue(value === 0 ? "" : Number(value).toLocaleString('en-IN'));
            }
        }
    }, [value, suffix]);

    // Handle manual input parsing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let displayValue = e.target.value;
        const rawString = displayValue.replace(/,/g, '');
        let val = parseFloat(rawString);

        // Format currency with commas actively while typing
        if (suffix !== "%") {
            const numOnly = rawString.replace(/[^\d]/g, '');
            displayValue = numOnly ? Number(numOnly).toLocaleString('en-IN') : '';
            val = parseInt(numOnly, 10);
        }

        setLocalValue(displayValue);

        if (!isNaN(val)) {
            onChange(val);
        }
    }

    // Handle blur to enforce min/max limits
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const rawString = e.target.value.replace(/,/g, '');
        let val = parseFloat(rawString);
        if (isNaN(val)) val = min;

        if (val < min) val = min;
        if (val > max) val = max;

        if (val !== value) {
            onChange(val);
        }

        // Force visual resync
        if (suffix === "%") {
            setLocalValue(val === 0 ? "" : val.toString());
        } else {
            setLocalValue(val === 0 ? "" : Number(val).toLocaleString('en-IN'));
        }
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium">{label}</label>
                <div className="flex items-center gap-2">
                    {symbol && <span className="text-sm text-brand-gold font-medium">{symbol}</span>}
                    <Input
                        ref={inputRef}
                        type={suffix === "%" ? "number" : "text"}
                        inputMode={suffix === "%" ? "decimal" : "numeric"}
                        step={suffix === "%" ? step : undefined}
                        value={localValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className="w-32 h-8 bg-brand-darkBg border-brand-surfaceBorder text-brand-gold font-mono text-right"
                    />
                    {suffix && <span className="text-sm text-brand-gold font-medium">{suffix}</span>}
                </div>
            </div>
            <Slider
                max={max}
                min={min}
                step={step}
                value={[value]}
                onValueChange={([val]) => onChange(val)}
                disabled={disabled}
            />
        </div>
    )
}
