export function LoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-3 text-lg">Loading chapter...</p>
            </div>
        </div>
    );
}