import van, { State } from "vanjs-core";
import { NativeSelect, NativeSelectOption } from "./ui/select";

const { div, h2, label, input,  button, span } = van.tags;

interface UserSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  maxWidth: number;
  backgroundColor: string;
  textColor: string;
  fontSaturation: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  fontSize: 16,
  lineHeight: 1.5,
  fontFamily: "serif",
  maxWidth: 700,
  backgroundColor: "#000",
  textColor: "#fff",
  fontSaturation: 1.0,
};

const STORAGE_KEY = "readingPageSettings";

const settings = Object.fromEntries(
  Object.entries(DEFAULT_SETTINGS).map(([key, value]) => [
    key,
    van.state(value),
  ])
) as { [K in keyof UserSettings]: State<UserSettings[K]> };

function loadSettings(): void {
  const savedSettings = localStorage.getItem(STORAGE_KEY);
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    Object.keys(settings).forEach((key) => {
      if (parsed[key] !== undefined) {
        (settings[key as keyof UserSettings] as State<any>).val = parsed[key];
      }
    });
  }
}

function saveSettings(): void {
  const currentValues = Object.fromEntries(
    Object.entries(settings).map(([key, state]) => [key, state.val])
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentValues));
}
const ReadingSettingsStyle = van.tags.style();

function applySettingsToContent(): void {
  const chpaterContainer =
    document.querySelector<HTMLDivElement>("#chpater-container");
  if (!chpaterContainer) return;
  const styleContent = `
  #chpater-container {
    --font-size: ${settings.fontSize.val}px;
    --line-height: ${String(settings.lineHeight.val)};
    --font-family: ${settings.fontFamily.val};
    --max-width: ${settings.maxWidth.val}px;
    --background: ${settings.backgroundColor.val};
    --foreground: ${settings.textColor.val};
    --font-saturation: ${String(settings.fontSaturation.val)};
    }`;

  ReadingSettingsStyle.textContent = styleContent;
}

let saveTimeout: ReturnType<typeof setTimeout>;

van.derive(() => {
  Object.values(settings).forEach((s) => s.val);
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSettings, 300);
  applySettingsToContent();
});

function SettingItem(
  id: keyof UserSettings,
  labelText: string,
  inputElement: () => HTMLElement | HTMLElement[]
) {
  return div(
    { class: "setting-item" },
    label({ htmlFor: id }, labelText),
    inputElement()
  );
}

function RangeInput(
  id: keyof UserSettings,
  min: string,
  max: string,
  step: string = "1",
  formatter: (val: number) => string = (val) => String(val)
) {
  return div(
    { class: "range-input-group" },
    input({
      type: "range",
      id,
      min,
      max,
      step,
      value: van.derive(() => settings[id].val),
      oninput: (e: Event) =>
        (settings[id].val = parseFloat((e.target as HTMLInputElement).value)),
    }),
    span(
      { class: "value-display" },
      van.derive(() => formatter(settings[id].val as number))
    )
  );
}

function ColorInput(id: keyof UserSettings) {
  return input({
    type: "color",
    id,
    value: van.derive(() => settings[id].val),
    oninput: (e: Event) =>
      (settings[id].val = (e.target as HTMLInputElement).value),
  });
}

function FontFamilySelect() {
  const fonts = [
    { value: "noto-kufi-arabic", label: "noto-kufi-arabic (Default)" },
    { value: "rubik", label: "Rubik" },
    { value: "cairo", label: "Cairo" },
    { value: "sans", label: "Sans" },
    { value: "zain", label: "Zain" },
  ];

  return NativeSelect(
    {
      id: "fontFamily",
      value: van.derive(() => settings.fontFamily.val),
      onchange: (e: Event) =>
        (settings.fontFamily.val = (e.target as HTMLSelectElement).value),
    },
    fonts.map((font) => NativeSelectOption({ value: font.value }, font.label))
  );
}

export const SettingsPanel = () =>
  div(
    { class: "settings-panel-content" },
    h2("Reading Settings"),
    SettingItem("fontSize", "Font Size:", () =>
      RangeInput("fontSize", "10", "32", "1", (v) => `${v}px`)
    ),
    SettingItem("lineHeight", "Line Height:", () =>
      RangeInput("lineHeight", "1.0", "2.5", "0.1")
    ),
    SettingItem("fontFamily", "Font Family:", () => FontFamilySelect()),
    SettingItem("maxWidth", "Line Width (Max):", () =>
      RangeInput("maxWidth", "400", "1000", "1", (v) => `${v}px`)
    ),
    SettingItem("backgroundColor", "Background Color:", () =>
      ColorInput("backgroundColor")
    ),
    SettingItem("textColor", "Text Color:", () => ColorInput("textColor")),
    SettingItem("fontSaturation", "Font Saturation (Opacity):", () =>
      RangeInput(
        "fontSaturation",
        "0.2",
        "1.0",
        "0.05",
        (v) => `${Math.round(v * 100)}%`
      )
    ),
    div(
      { class: "settings-actions" },
      button(
        {
          className: "vbtn destructive md",
          onclick: () => {
            localStorage.setItem("readerEnabled", "false");
            location.reload();
          },
        },
        "Disable Reader"
      ),
      button(
        {
          onclick: () => {
            Object.keys(DEFAULT_SETTINGS).forEach((key) => {
              settings[key as keyof UserSettings].val =
                DEFAULT_SETTINGS[key as keyof UserSettings];
            });
          },
          className: "vbtn secondary md",
        },
        "Reset Settings"
      )
    )
  );

const panelVisible = van.state(false);

export function initializeReaderSettings(): void {
  const toggleButton = button(
    {
      class: "settings-toggle-button",
      onclick: () => (panelVisible.val = !panelVisible.val),
    },
    van.derive(() => (panelVisible.val ? "✖" : "⚙"))
  );

  const panel = div(
    {
      id: "van-settings-panel",
      class: van.derive(() => (panelVisible.val ? "open" : "")),
    },
    toggleButton,
    ReadingSettingsStyle,
    SettingsPanel()
  );

  van.add(document.body, panel);

  loadSettings();
  applySettingsToContent();
}
