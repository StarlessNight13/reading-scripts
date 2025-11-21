import { useCallback, useState } from "react";



export function useLocalStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? (JSON.parse(stored) as T) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    const setStoredValue = useCallback(
        (newValue: T) => {
            setValue(newValue);
            try {
                localStorage.setItem(key, JSON.stringify(newValue));
            } catch {
                console.warn(`Unable to store ${key} in localStorage`);
            }
        },
        [key]
    );

    return [value, setStoredValue] as const;
}
