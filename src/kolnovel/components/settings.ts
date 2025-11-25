// kolnovel

import van, { State } from "vanjs-core";
import { NativeSelect, NativeSelectOption } from "./ui/select";
import { UserSettings } from "../types";

const { div, h2, label, input, button, span, style } = van.tags;

const DEFAULT_SETTINGS: UserSettings = {
  fontSize: 16,
  lineHeight: 1.5,
  fontFamily: "noto-kufi-arabic",
  maxWidth: 700,
  backgroundColor: "#1a1a1a",
  textColor: "#e0e0e0",
  fontSaturation: 1.0,
};

const STORAGE_KEY = "CustomReader";

// Reactive Settings Object
const settingsState = {} as {
  [K in keyof UserSettings]: State<UserSettings[K]>;
};

// Initialize State
Object.entries(DEFAULT_SETTINGS).forEach(([key, val]) => {
  // @ts-ignore
  settingsState[key] = van.state(val);
});

// Persistence & Application Logic
const StyleTag = style();
let saveTimer: ReturnType<typeof setTimeout>;

function syncSettings() {
  // 1. Save to LocalStorage
  const plainSettings = Object.fromEntries(
    Object.entries(settingsState).map(([k, v]) => [k, v.val])
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plainSettings));

  // 2. Apply CSS Variables
  const s = settingsState;
  StyleTag.textContent = `
    #chapter-container {
      --font-size: ${s.fontSize.val}px;
      --line-height: ${s.lineHeight.val};
      --font-family: ${s.fontFamily.val};
      --max-width: ${s.maxWidth.val}px;
      --background: ${s.backgroundColor.val};
      --foreground: ${s.textColor.val};
      --font-saturation: ${s.fontSaturation.val};
    }
  `;
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.keys(DEFAULT_SETTINGS).forEach((key) => {
        if (parsed[key] !== undefined) {
          // @ts-ignore
          settingsState[key].val = parsed[key];
        }
      });
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
}

// Watcher
van.derive(() => {
  // Access all vals to trigger dependency
  Object.values(settingsState).forEach((s) => s.val);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(syncSettings, 200);
});

// --- UI Components ---

function SettingRow(labelTxt: string, ...children: HTMLElement[]) {
  return div({ class: "setting-item" }, label(labelTxt), ...children);
}

function RangeControl(
  prop: keyof UserSettings,
  min: number,
  max: number,
  step: number,
  format = (v: number) => String(v)
) {
  const state = settingsState[prop] as State<number>;
  return div(
    { class: "range-input-group" },
    input({
      type: "range",
      min,
      max,
      step,
      value: state,
      oninput: (e) =>
        (state.val = Number((e.target as HTMLInputElement).value)),
    }),
    span({ class: "value-display" }, () => format(state.val))
  );
}

const SettingsPanel = () =>
  div(
    { class: "settings-panel-content" },
    h2("Reader Settings"),
    SettingRow(
      "Font Size",
      RangeControl("fontSize", 12, 40, 1, (v) => `${v}px`)
    ),
    SettingRow("Line Height", RangeControl("lineHeight", 1, 3, 0.1)),
    SettingRow(
      "Max Width",
      RangeControl("maxWidth", 400, 1200, 10, (v) => `${v}px`)
    ),
    SettingRow(
      "Saturation",
      RangeControl(
        "fontSaturation",
        0.2,
        1,
        0.1,
        (v) => `${Math.round(v * 100)}%`
      )
    ),
    SettingRow(
      "Font Family",
      NativeSelect(
        {
          value: settingsState.fontFamily,
          onchange: (e: Event) =>
            (settingsState.fontFamily.val = (
              e.target as HTMLSelectElement
            ).value),
        },
        NativeSelectOption(
          { value: "noto-kufi-arabic" },
          "Noto Kufi (Default)"
        ),
        NativeSelectOption({ value: "rubik" }, "Rubik"),
        NativeSelectOption({ value: "sans" }, "Sans Serif"),
        NativeSelectOption({ value: "zain" }, "Zain"),
        NativeSelectOption({ value: "cairo" }, "Cairo")
      )
    ),
    SettingRow(
      "Colors",
      div(
        { style: "display: flex; gap: 10px;" },
        input({
          type: "color",
          value: settingsState.backgroundColor,
          oninput: (e) =>
            (settingsState.backgroundColor.val = (
              e.target as HTMLInputElement
            ).value),
          title: "Background",
        }),
        input({
          type: "color",
          value: settingsState.textColor,
          oninput: (e) =>
            (settingsState.textColor.val = (
              e.target as HTMLInputElement
            ).value),
          title: "Text",
        })
      )
    ),
    div(
      { class: "settings-actions" },
      button(
        {
          class: "vbtn destructive",
          onclick: () => {
            localStorage.setItem("readerEnabled", "false");
            location.reload();
          },
        },
        "Exit Reader"
      ),
      button(
        {
          class: "vbtn secondary",
          onclick: () =>
            Object.assign(
              settingsState,
              Object.fromEntries(
                Object.entries(DEFAULT_SETTINGS).map(([k, v]) => [
                  k,
                  { val: v },
                ])
              )
            ),
        },
        "Reset"
      )
    )
  );

export function initSettings() {
  loadSettings();
  const isOpen = van.state(false);

  van.add(
    document.body,
    StyleTag,
    div(
      {
        id: "van-settings-panel",
        class: () => (isOpen.val ? "open" : ""),
      },
      button(
        {
          class: "settings-toggle-button",
          onclick: () => (isOpen.val = !isOpen.val),
        },
        () => (isOpen.val ? "✖" : "⚙")
      ),
      SettingsPanel()
    )
  );
}
