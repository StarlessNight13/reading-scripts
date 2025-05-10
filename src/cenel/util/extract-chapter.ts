export default function extractChapterData(doc: Document) {
    const bookmarkButton = doc.querySelector<HTMLAnchorElement>(
        'a.wp-manga-action-button[data-action="bookmark"]'
    );
    const chapterIdStr = bookmarkButton?.getAttribute("data-chapter");
    const id = chapterIdStr
        ? Number(chapterIdStr)
        : Number(
            doc
                .querySelector<HTMLAnchorElement>("#wp-manga-current-chap")
                ?.getAttribute("data-id")
        ); // Parse ID, handle missing attribute
    const content =
        doc.querySelector(
            " div.reading-content > div.text-left > div.text-right"
        )?.innerHTML ?? "<p>Error: Chapter content not found.</p>";

    if (content.includes("Error: Chapter content not found.")) {
        console.warn("Could not extract chapter content from expected selectors.");
    }

    const scriptThatHasTheNovelCover = doc.querySelector<HTMLScriptElement>(
        `[type="application/ld+json"]`
    )?.textContent;
    const json = JSON.parse(scriptThatHasTheNovelCover ?? "");
    const novelCover = json.image.url as string | undefined;
    const novelElement = document.querySelector<HTMLAnchorElement>(
        "#manga-reading-nav-head > div > div.entry-header_wrap > div > div.c-breadcrumb > ol > li:nth-child(2) > a"
    );
    const novel = {
        name: novelElement?.textContent ?? "Novel",
        link: novelElement?.href ?? "",
        id: Number(bookmarkButton?.getAttribute("data-post") ?? 0),
        cover: novelCover,
    };

    return { content, id, novel };
}