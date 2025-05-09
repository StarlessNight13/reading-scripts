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

type ChapterData = {
  id: number;
  title: string;
  url: string;
  content: string;
  index: string;
};

export default function ChpaterContent({
  fontSize,
  fontFamily,
  textGap,
  chapterData,
  textWidth,
  textAlign,
}: ChapterContentProps) {
  return (
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
  );
}
