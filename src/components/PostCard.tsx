import { motion } from "framer-motion";

interface PostCardProps {
    id: string;
    title: string;
    body: string;
    author: string;
    createdAt: string;
    votes: number;
    commentsCount: number;
}

export default function PostCard({
                                     title,
                                     body,
                                     author,
                                     createdAt,
                                     votes,
                                     commentsCount,
                                 }: PostCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer"
        >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-700 mb-4 line-clamp-3">{body}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
                <span>By {author}</span>
                <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 mt-4">
                <span>👍 {votes}</span>
                <span>💬 {commentsCount}</span>
            </div>
        </motion.div>
    );
}
