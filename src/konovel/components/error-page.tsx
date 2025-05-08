import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function ErrorPage({
  modelTitle,
  modelText,
}: {
  modelTitle: string;
  modelText: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card>
        <CardHeader>
          <CardTitle>{modelTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">{modelText}</p>
        </CardContent>
        <CardFooter className="flex justify-center gap-2 flex-col sm:flex-row">
          <Button variant="outline" asChild>
            <a href="/">العودة إلى الصفحة الرئيسية</a>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            العودة للوراء
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
