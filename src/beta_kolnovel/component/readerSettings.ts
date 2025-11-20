import van, { State } from "vanjs-core";

const { div, h2, label, input, select, option, button, span, br } = van.tags;

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

let readingContentElement: HTMLElement | null = null;

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

function applySettingsToContent(): void {
  if (!readingContentElement) return;

  Object.assign(readingContentElement.style, {
    fontSize: `${settings.fontSize.val}px`,
    lineHeight: String(settings.lineHeight.val),
    fontFamily: settings.fontFamily.val,
    maxWidth: `${settings.maxWidth.val}px`,
    backgroundColor: settings.backgroundColor.val,
    color: settings.textColor.val,
    opacity: String(settings.fontSaturation.val),
    margin: "0 auto",
    boxSizing: "border-box",
  });
}

let saveTimeout: ReturnType<typeof setTimeout>;

van.derive(() => {
  Object.values(settings).forEach((s) => s.val);
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSettings, 300);
  applySettingsToContent();
});

function RangeInput(
  id: keyof UserSettings,
  labelText: string,
  min: string,
  max: string,
  step: string = "1",
  formatter: (val: number) => string = (val) => String(val)
) {
  return [
    label({ htmlFor: id }, labelText),
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
    ),
    br(),
  ];
}

function ColorInput(id: keyof UserSettings, labelText: string) {
  return [
    label({ htmlFor: id }, labelText),
    input({
      type: "color",
      id,
      value: van.derive(() => settings[id].val),
      oninput: (e: Event) =>
        (settings[id].val = (e.target as HTMLInputElement).value),
    }),
    br(),
  ];
}

function FontFamilySelect() {
  const fonts = [
    { value: "serif", label: "Serif (Default)" },
    { value: "sans-serif", label: "Sans-serif" },
    { value: "monospace", label: "Monospace" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Palatino, serif", label: "Palatino" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Verdana, sans-serif", label: "Verdana" },
  ];

  return [
    label({ htmlFor: "fontFamily" }, "Font Family:"),
    select(
      {
        id: "fontFamily",
        value: van.derive(() => settings.fontFamily.val),
        onchange: (e: Event) =>
          (settings.fontFamily.val = (e.target as HTMLSelectElement).value),
      },
      fonts.map((font) => option({ value: font.value }, font.label))
    ),
    br(),
  ];
}

export const SettingsPanel = () =>
  div(
    { class: "settings-panel" },
    h2("Reading Settings"),
    ...RangeInput("fontSize", "Font Size:", "10", "32", "1", (v) => `${v}px`),
    ...RangeInput("lineHeight", "Line Height:", "1.0", "2.5", "0.1"),
    ...FontFamilySelect(),
    ...RangeInput(
      "maxWidth",
      "Line Width (Max):",
      "400",
      "1000",
      "1",
      (v) => `${v}px`
    ),
    ...ColorInput("backgroundColor", "Background Color:"),
    ...ColorInput("textColor", "Text Color:"),
    ...RangeInput(
      "fontSaturation",
      "Font Saturation (Opacity):",
      "0.2",
      "1.0",
      "0.05",
      (v) => `${Math.round(v * 100)}%`
    ),
    button(
      {
        className: "rs-main-btn",
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
      },
      "Reset Settings"
    )
  );

const panelVisible = van.state(false);

export function initializeReaderSettings(): void {
  readingContentElement = document.querySelector(".reading-content");

  const panelContainer = div(
    { class: "settings-panel-container" },
    SettingsPanel()
  );

  const toggleButton = button(
    {
      class: "settings-toggle-button",
      onclick: () => (panelVisible.val = !panelVisible.val),
    },
    van.derive(() => (panelVisible.val ? "✖" : "⚙"))
  );

  van.derive(() => {
    panelContainer.classList.toggle("visible", panelVisible.val);
    toggleButton.classList.toggle("open", panelVisible.val);
  });

  document.body.append(panelContainer, toggleButton);

  loadSettings();
  applySettingsToContent();
}
