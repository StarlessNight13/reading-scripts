

function scrapData(doc: Document) {
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
        return null;
    }

    return { content, id };
}



export const api = {
    getChapter: async (chapterUrl: string) => {
        const response = await fetch(chapterUrl);
        const data = await response.text();
        const doc = new DOMParser().parseFromString(data, "text/html");
        return scrapData(doc);
    },
}