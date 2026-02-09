'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string | number;
    onValueChange: (value: string) => void;
    className?: string;
}

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    // Format number with commas
    const format = (val: string | number) => {
        if (val === undefined || val === null || val === '') return '';
        const numericStr = val.toString().replace(/[^0-9.]/g, '');
        const parts = numericStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    // Parse string back to numeric string
    const parse = (val: string) => {
        return val.replace(/,/g, '');
    };

    useEffect(() => {
        const formatted = format(value);
        if (formatted !== displayValue) {
            setDisplayValue(formatted);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericValue = parse(rawValue);

        // Allow only numbers and one decimal point
        if (/^\d*\.?\d*$/.test(numericValue)) {
            setDisplayValue(format(numericValue));
            onValueChange(numericValue);
        }
    };

    return (
        <Input
            {...props}
            type="text"
            value={displayValue}
            onChange={handleChange}
            className={cn('font-mono', className)} // Using mono for better digit alignment
        />
    );
}
