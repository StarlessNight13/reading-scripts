import van, { ChildDom } from "vanjs-core";
import { ChevronDown as ChevronDownIcon } from "vanjs-lucide";

const { div, select, option, optgroup } = van.tags;

interface NativeSelectProps extends Record<string, any> {
  className?: string;
  disabled?: boolean;
}

interface NativeSelectOptionProps extends Record<string, any> {}

interface NativeSelectOptGroupProps extends Record<string, any> {
  className?: string;
}

function NativeSelect(
  { className, ...props }: NativeSelectProps,
  ...children: ChildDom[]
) {
  return div(
    {
      class: () =>
        ["native-select-wrapper", props.disabled ? "disabled" : ""].join(" "),
      "data-slot": "native-select-wrapper",
    },
    select(
      {
        "data-slot": "native-select",
        class: ["native-select", className].filter(Boolean).join(" "),
        ...props,
      },
      children
    ),
    ChevronDownIcon({ class: "native-select-icon" })
  );
}

function NativeSelectOption(
  props: NativeSelectOptionProps,
  ...children: ChildDom[]
) {
  return option({ "data-slot": "native-select-option", ...props }, children);
}

function NativeSelectOptGroup(
  { className, ...props }: NativeSelectOptGroupProps,
  ...children: ChildDom[]
) {
  return optgroup(
    {
      "data-slot": "native-select-optgroup",
      ...(className && { class: className }),
      ...props,
    },
    children
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
