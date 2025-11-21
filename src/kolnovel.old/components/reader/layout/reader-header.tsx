import { Button } from "@/components/ui/button";
import SettingsDialog from "../chapter/settingsDialog";
import { ReaderSettings } from "@/kolnovel.old/types/reader";
import { ChapterData } from "@/kolnovel.old/types/reader";

interface ReaderHeaderProps {
    settings: ReaderSettings;
    updateSetting: <K extends keyof ReaderSettings>(
        key: K,
        value: ReaderSettings[K]
    ) => void;
    activeChapter: ChapterData | null;
    novelName?: string;
}

export function ReaderHeader({
    settings,
    updateSetting,
    activeChapter,
    novelName,
}: ReaderHeaderProps) {
    return (
        <header className="flex sticky top-0 bg-background/30 backdrop-blur z-50 h-16 shrink-0 items-center justify-between gap-2 border-b p-4 font-rubik text-center">
            <SettingsDialog
                fontSize={settings.fontSize}
                setFontSize={(val) => updateSetting("fontSize", val)}
                fontFamily={settings.fontFamily}
                setFontFamily={(val) => updateSetting("fontFamily", val)}
                textGap={settings.textGap}
                setTextGap={(val) => updateSetting("textGap", val)}
                textWidth={settings.textWidth}
                setTextWidth={(val) => updateSetting("textWidth", val)}
                textAlign={settings.textAlign}
                setTextAlign={(val) => updateSetting("textAlign", val)}
            />

            {activeChapter ? (
                <Button variant="link" asChild className="truncate flex-1">
                    <a
                        href={activeChapter.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {novelName || "Novel"}: {activeChapter.title}
                    </a>
                </Button>
            ) : (
                <div className="w-1/3"></div>
            )}
        </header>
    );
}