import { useMemo } from 'react';

export function useTransactionDate(value, onChange) {
    // Value is the current ISO string from parent state
    // onChange is a function: (newDateString) => void

    const safeDate = useMemo(() => {
        try {
            if (value && typeof value === 'string') {
                return value;
            }
            // Fallback
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 19);
        } catch {
            return new Date().toISOString().slice(0, 19);
        }
    }, [value]);

    // Derived values for UI
    const datePart = safeDate.slice(0, 10);

    let hours24 = 0;
    try { 
        hours24 = parseInt(safeDate.slice(11, 13)) || 0; 
    } catch {
        hours24 = 0;
    }

    let minutes = '00';
    try { 
        minutes = safeDate.slice(14, 16) || '00'; 
    } catch {
        minutes = '00';
    }

    let seconds = '00';
    try { 
        seconds = safeDate.slice(17, 19) || '00'; 
    } catch {
        seconds = '00';
    }

    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = (hours24 % 12) || 12;

    const updateTime = (key, valInput) => {
        try {
            let currentH = parseInt(safeDate.slice(11, 13)) || 0;
            let val = key === 'ampm' ? valInput : parseInt(valInput);
            let h = currentH;

            if (key === 'hour') {
                if (isNaN(val)) return;
                if (val < 1) val = 1; if (val > 12) val = 12;
                if (ampm === 'PM' && val !== 12) h = val + 12;
                else if (ampm === 'AM' && val === 12) h = 0;
                else h = val;
            } else if (key === 'minute' || key === 'second') {
                // handled purely by formatting below
            } else if (key === 'ampm') {
                if (val === 'AM' && currentH >= 12) h -= 12;
                if (val === 'PM' && currentH < 12) h += 12;
            }

            const newH = h.toString().padStart(2, '0');
            const newM = key === 'minute' ? valInput.toString().padStart(2, '0') : minutes;
            const newS = key === 'second' ? valInput.toString().padStart(2, '0') : seconds;

            onChange(`${datePart}T${newH}:${newM}:${newS}`);
        } catch (e) { console.error("Time update error", e); }
    };

    const setDatePart = (newDatePart) => {
        onChange(`${newDatePart}T${safeDate.slice(11)}`);
    }

    return {
        datePart,
        hours12,
        minutes,
        seconds,
        ampm,
        updateTime,
        setDatePart
    };
}
