import van from "vanjs-core";

const { button, div } = van.tags;

const LOCAL_STORAGE_READER_KEY = "readerEnabled";

export const getReaderState = (host: string) =>
  window.localStorage.getItem(`${LOCAL_STORAGE_READER_KEY}_${host}`) === "true";

export const setReaderState = (host: string, enabled: boolean) =>
  window.localStorage.setItem(
    `${LOCAL_STORAGE_READER_KEY}_${host}`,
    String(enabled)
  );

/**
 * Injects a toggle button into the target element.
 * @param targetElement The DOM element to append the button to.
 * @param initialState The initial state of the reader (enabled/disabled).
 * @param host A unique identifier for the current host (e.g., "cenel", "kolnovel").
 * @param buttonTextActive Text for the button when reader is active.
 * @param buttonTextInactive Text for the button when reader is inactive.
 * @param className CSS class for the button.
 */
export function injectToggle(
  targetElement: Element,
  initialState: boolean,
  host: string,
  buttonTextActive: string = "Disable Reader",
  buttonTextInactive: string = "Enable Reader",
  className: string = "reader-toggle-btn"
) {
  if (!targetElement) return;

  const toggleState = van.state(initialState); // Local state for the button text

  van.add(
    targetElement,
    div(
      {
        style: "display: flex; justify-content: center; align-items: center;", // Ensure this styling works for both
      },
      button(
        {
          className: className,
          onclick: () => {
            setReaderState(host, !toggleState.val);
            location.reload();
          },
        },
        van.derive(() =>
          toggleState.val ? buttonTextActive : buttonTextInactive
        )
      )
    )
  );
}

export function Toggler() {
  const host = document.body.getAttribute("host")!;
  return button(
    {
      class: "vbtn destructive",
      onclick: () => {
        setReaderState(host, false);
        location.reload();
      },
    },
    "Exit Reader"
  );
}
