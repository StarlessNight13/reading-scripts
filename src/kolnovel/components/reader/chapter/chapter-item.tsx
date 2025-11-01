import { RefObject } from "react";
import ChapterContent from "./ChapterContent";
import { ChapterData } from "@/kolnovel/types/reader";
import { ReaderSettings } from "@/kolnovel/types/reader";

interface ChapterItemProps {
    chapter: ChapterData;
    settings: ReaderSettings;
    isLast: boolean;
    lastChapterRef: RefObject<HTMLDivElement> | null;
}

export function ChapterItem({
    chapter,
    settings,
    isLast,
    lastChapterRef,
}: ChapterItemProps) {
    return (
        <div
            key={`chapter-${chapter.id}`}
            className="chapter-container flex flex-col mb-20"
            data-url={`https://kolnovel.com/reader?chapterId=${chapter.id}`}
            data-read={chapter.read}
            data-chapter-id={chapter.id}
            id={`chapter-${chapter.id}`}
            ref={isLast ? lastChapterRef : null}
        >
            <div className="flex flex-col gap-4 justify-center items-center my-8 pt-8">
                <a href={chapter.url} target="_blank" rel="noopener noreferrer">
                    {chapter.title}
                </a>
                <h1
                    className="text-3xl md:text-5xl font-bold text-center data-[read='true']:text-primary px-4"
                    data-read={chapter.read}
                >
                    {chapter.title}
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {chapter.index}
                </span>
            </div>

            <ChapterContent
                fontSize={settings.fontSize}
                fontFamily={settings.fontFamily}
                textGap={settings.textGap}
                textWidth={settings.textWidth}
                textAlign={settings.textAlign}
                chapterData={chapter}
            />

            {!isLast && <hr className="my-12 border-t-2 w-1/2 mx-auto" />}
        </div>
    );
}