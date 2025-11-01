import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ErrorStateProps {
    error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
    return (
        <Card className="mx-auto my-8 max-w-lg">
            <CardHeader>
                <CardTitle className="text-center">Chapter Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-gray-500">
                    {error || "Please check the ID and try again."}
                </p>
            </CardContent>
            <CardFooter className="flex flex-col justify-center gap-2 sm:flex-row">
                <Button variant="outline" asChild>
                    <a href="/">Back to Home</a>
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </CardFooter>
        </Card>
    );
}