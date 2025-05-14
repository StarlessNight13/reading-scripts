import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlignCenter,
  AlignLeft,
  AlignRightIcon,
  ChevronsLeftRightEllipsisIcon,
  ChevronsUpDown,
  Settings,
} from "lucide-react";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsDialog({
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  textGap,
  setTextGap,
  textWidth,
  setTextWidth,
  textAlign,
  setTextAlign,
}: {
  fontSize: number;
  setFontSize: (value: number) => void;
  fontFamily: string;
  setFontFamily: (value: string) => void;
  textGap: number;
  setTextGap: (value: number) => void;
  textWidth: number;
  setTextWidth: (value: number) => void;
  textAlign: "left" | "center" | "right";
  setTextAlign: (value: "left" | "center" | "right") => void;
}) {
  const toggleSetting = useCallback(
    (
      type: "fontSize" | "fontFamily" | "textGap" | "textWidth" | "textAlign",
      value: string
    ) => {
      switch (type) {
        case "fontSize":
          setFontSize(Number(value));
          break;
        case "textGap":
          setTextGap(Number(value));
          break;
        case "fontFamily":
          setFontFamily(value);
          break;
        case "textWidth":
          setTextWidth(Number(value));
          break;
        case "textAlign":
          const align = value as "left" | "center" | "right";
          setTextAlign(align);
          break;
      }
    },
    [setFontSize, setFontFamily, setTextGap]
  );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reading Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 p-4">
          <div>
            <h3 className="text-sm font-medium">Font Size</h3>
            <div className="flex items-center gap-4">
              <span className="text-xs">A</span>
              <Slider
                min={12}
                max={50}
                step={1}
                value={[fontSize]}
                onValueChange={(e) =>
                  toggleSetting("fontSize", e[0].toString())
                }
                className="flex-1"
              />

              <span className="text-lg">A</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium">Text Gap</h3>
            <div className="flex items-center gap-4">
              <ChevronsUpDown />
              <Slider
                min={0}
                max={100}
                step={1}
                value={[textGap]}
                onValueChange={(e) => toggleSetting("textGap", e[0].toString())}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium">Text Width</h3>
            <div className="flex items-center gap-4">
              <ChevronsLeftRightEllipsisIcon />
              <Slider
                min={0}
                max={30}
                step={1}
                value={[textWidth]}
                onValueChange={(e) =>
                  toggleSetting("textWidth", e[0].toString())
                }
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <ToggleGroup
              type="single"
              size="lg"
              value={textAlign}
              onValueChange={(value) => toggleSetting("textAlign", value)}
            >
              <ToggleGroupItem value="left">
                <AlignLeft />
              </ToggleGroupItem>
              <ToggleGroupItem value="center">
                <AlignCenter />
              </ToggleGroupItem>
              <ToggleGroupItem value="right">
                <AlignRightIcon />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <h3 className="text-sm font-medium text-left">Font Family</h3>
            <Select
              value={fontFamily}
              onValueChange={(value) => toggleSetting("fontFamily", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="noto-kufi-arabic">
                  Noto Kufi Arabic
                </SelectItem>
                <SelectItem value="zain">Zain</SelectItem>
                <SelectItem value="rubik">Rubik</SelectItem>
                <SelectItem value="cairo">Cairo</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="sans">Sans-serif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <h3 className="text-sm font-medium">Theme</h3>
            <ModeToggle />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
