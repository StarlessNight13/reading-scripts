import van from "vanjs-core";
import { Palette, SunMoon } from "vanjs-lucide";

const { div, span, input, label } = van.tags;

const STORAGE_KEY = "reader_theme";
const MODE_KEY = "reader_theme_mode";

type ThemeMode = "light" | "dark";

const themes = [
  "default",
  "amethyst-haze",
  "bold-tech",
  "bubbelgum",
  "catppuccin",
] as const;
type Theme = (typeof themes)[number];

function loadFromStorage(): {
  theme: Theme;
  mode: ThemeMode;
} {
  const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
  const savedMode = localStorage.getItem(MODE_KEY) as ThemeMode | null;

  return {
    theme: savedTheme || "default",
    mode: savedMode === "light" || savedMode === "dark" ? savedMode : "dark",
  };
}

const initial = loadFromStorage();
const themeState = van.state<Theme>(initial.theme);
const themeMode = van.state<ThemeMode>(initial.mode);

function setThemeInDoc() {
  localStorage.setItem(STORAGE_KEY, themeState.val);
  localStorage.setItem(MODE_KEY, themeMode.val);
  document.body.className = themeMode.val + " " + themeState.val;
}

const ThemToggler = (theme: Theme) => {
  return div(
    {
      class: () => theme + " " + themeMode.val,
    },
    input({
      class: "cui-toggle-input",
      type: "checkbox",
      id: "theme-" + theme,
      checked: () => themeState.val === theme,
      onchange: (e: Event) => {
        const checked = (e.target as HTMLInputElement).checked;
        themeState.val = checked ? theme : "default";
        setThemeInDoc();
      },
    }),
    label(
      {
        for: "theme-" + theme,
        class: "cui-toggle-item base-label ",
      },
      Palette(),
      span(theme)
    )
  );
};

export default function ThemeSection() {
  setThemeInDoc();
  return div(
    {
      class: "theme-section",
    },
    div(
      {
        style: "display: flex; align-items: center; gap: 1rem;",
      },
      input({
        class: "cui-toggle-input",
        type: "checkbox",
        id: "theme-toggle",
        checked: () => themeMode.val === "dark",
        onchange: (e: Event) => {
          const checked = (e.target as HTMLInputElement).checked;
          themeMode.val = checked ? "dark" : "light";
          setThemeInDoc();
        },
      }),
      label(
        {
          style: "flex: 1;",
          for: "theme-toggle",
          class: "cui-toggle-item base-label",
        },
        SunMoon(),
        span("Light/Dark")
      )
    ),
    div(
      {
        class: "theme-toggle-group",
      },
      themes.map((t) => ThemToggler(t))
    )
  );
}
