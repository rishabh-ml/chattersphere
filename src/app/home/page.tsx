import Feed from "./Feed";

export default function HomePage() {
    return (
        <main className="max-w-2xl mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-6">Home Feed</h1>
            <Feed />
        </main>
    );
}
