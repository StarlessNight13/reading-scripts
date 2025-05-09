import { cleanupHeadScriptsAndStyles, extractChaptersMetaData } from "./utils";

export default function (tailwindcss: string) {

    // 1. Cleanup existing elements
    cleanupHeadScriptsAndStyles();

    const chapterList = extractChaptersMetaData();


}