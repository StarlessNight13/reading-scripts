import { useCallback, useEffect, useState } from "react";
import { ReaderSettings } from "../types/reader";

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  fontFamily: "serif",
  textGap: 0,
  textWidth: 0,
  textAlign: "left",
};

const STORAGE_KEYS: Record<keyof ReaderSettings, string> = {
  fontSize: "fontSize",
  fontFamily: "fontFamily",
  textGap: "textGap",
  textWidth: "textWidth",
  textAlign: "textAlign",
};

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadSettings = (): ReaderSettings => {
      return {
        fontSize:
          Number(localStorage.getItem(STORAGE_KEYS.fontSize)) ||
          DEFAULT_SETTINGS.fontSize,
        fontFamily:
          localStorage.getItem(STORAGE_KEYS.fontFamily) ||
          DEFAULT_SETTINGS.fontFamily,
        textGap:
          Number(localStorage.getItem(STORAGE_KEYS.textGap)) ||
          DEFAULT_SETTINGS.textGap,
        textWidth:
          Number(localStorage.getItem(STORAGE_KEYS.textWidth)) ||
          DEFAULT_SETTINGS.textWidth,
        textAlign:
          (localStorage.getItem(
            STORAGE_KEYS.textAlign
          ) as ReaderSettings["textAlign"]) || DEFAULT_SETTINGS.textAlign,
      };
    };

    setSettings(loadSettings());
  }, []);

  const updateSetting = useCallback(
    <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        localStorage.setItem(STORAGE_KEYS[key], String(value));
        return newSettings;
      });
    },
    []
  );

  return { settings, updateSetting };
}
