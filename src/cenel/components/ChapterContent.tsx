type ChapterContentProps = {
  fontSize: number;
  fontFamily: string;
  textGap: number;
  textWidth: number;
  textAlign: "left" | "center" | "right";
  chapterData: ChapterData;
  getNextChapter?: () => void;
  hasNextChapter?: boolean;
};
interface ChapterInfo {
  title: string;
  link: string;
  chapterIndex: number;
}
interface ChapterData extends ChapterInfo {
  id: number;
  content: string;
  read: boolean;
}

export default function ChpaterContent({
  fontSize,
  fontFamily,
  textGap,
  chapterData,
  textWidth,
  textAlign,
}: ChapterContentProps) {
  return (
    <main className="flex flex-1 flex-col justify-center ">
      <article
        className={`prose prose-lg dark:prose-invert flex flex-col flex-1 ${fontFamily}`}
        style={{
          fontSize: `${fontSize}px`,
          gap: `${textGap}px`,
          paddingInline: `${textWidth}%`,
          textAlign: textAlign,
        }}
        dangerouslySetInnerHTML={{ __html: chapterData.content }}
      />
    </main>
  );
}
