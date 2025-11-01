import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function EmptyState() {
    return (
        <Card className="mx-auto my-8 max-w-lg">
            <CardHeader>
                <CardTitle className="text-center">No Chapter Data</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-gray-500">
                    Could not load any chapter data.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col justify-center gap-2 sm:flex-row">
                <Button variant="outline" asChild>
                    <a href="/">Back to Home</a>
                </Button>
            </CardFooter>
        </Card>
    );
}