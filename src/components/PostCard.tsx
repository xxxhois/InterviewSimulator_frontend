import type { Post } from '@/types/post';

function getFirstLines(text: string, lines: number = 3): string {
  // 按换行分割，取前三行
  const arr = text.split(/\r?\n/);
  return arr.slice(0, lines).join('\n') + (arr.length > lines ? '...' : '');
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
    }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{post.title}</h2>
      <pre style={{
        fontSize: 15,
        color: '#444',
        marginBottom: 12,
        whiteSpace: 'pre-line',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxHeight: 60,
        lineHeight: '1.4em'
      }}>{getFirstLines(post.content, 3)}</pre>
      <div style={{ fontSize: 13, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
        <span>作者：{post.author}</span>
        <span>{new Date(post.created_at).toLocaleString()}</span>
        <span>回复：{post.reply_count}</span>
      </div>
    </div>
  );
} 