'use client';
import { useRouter } from "next/navigation";

export default function WrittenTestListPage() {
    const router = useRouter();
    return (
        <div>
            <h1>题库等待接入，敬请期待</h1>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-md" onClick={() => router.push('/written-test/ide')}>进入机试示例页面</button>
        </div>
    )
}