import { api } from "./api";

export const novelPageUtils = {
    getNovelData: async () => {
        const uri = location.pathname.split("/")[2];
        const novelId = await api.getNovelBySlug(uri);
        const name = document.querySelector(".cat-series")?.textContent ?? "";
        const cover = document.querySelector(".cover-img")?.getAttribute("src") ?? "";
        return {
            id: novelId?.id,
            uri: novelId?.link,
            name: name,
            cover: cover,
            chaptersCount: novelId?.count,
        }
    }
}