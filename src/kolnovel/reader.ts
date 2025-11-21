import van, { State } from "vanjs-core";
import { ChapterData } from "./types";

const { div, main, article, footer, span } = van.tags;

// Define structure for appending content dynamically
export function updateReaderContent(data: ChapterData) {
  const container = document.getElementById("chapter-container");
  if (!container) return;

  van.add(
    container,
    div({
      class: "reading-content",
      innerHTML: data.content,
      "data-id": data.id,
      "data-redirect": data.url,
    })
  );
}

export function ReaderView(
  initialData: State<ChapterData>,
  loading: State<boolean>
) {
  return main(
    article(
      { id: "chapter-container", class: "chapter-container" },
      div({
        class: "reading-content",
        innerHTML: initialData.val.content,
        "data-redirect": initialData.val.url,
        "data-id": initialData.val.id,
      })
    ),
    footer(
      { class: "footer-container" },
      div(
        { class: "loading-indicator" },
        span({ class: () => (loading.val ? "loader" : "") })
      )
    )
  );
}
