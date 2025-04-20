export default function FeedSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-gray-200 animate-pulse h-40 rounded-xl" />
            ))}
        </div>
    );
}
