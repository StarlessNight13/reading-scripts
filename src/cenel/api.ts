export const api = {
    getChapter: async (chapterUrl: string) => {
        const chapterId = chapterUrl.split("/").pop();
        const response = await fetch(`https://api.novelupdates.com/v2/chapter/${chapterId}`, {
            headers: {
                "x-api-key": "e9b7e5b9-d0a1-4d3b-b4a3-e6d9e0c9c5d2",
            },
        });
        const data = await response.json();
        return data;
    },
}