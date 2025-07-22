import { marked } from 'marked';
import type { Post } from '@/types/post';
function detectContentType(content: string): 'html' | 'md' {
  // Simple check: if it contains HTML tags, treat as HTML
  return /<[^>]+>/.test(content) ? 'html' : 'md';
}

export default function PostCard({ post }: { post: Post }) {
  const type = detectContentType(post.content);

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        background: '#fff',
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{post.title}</h2>
      <div
        style={{
          fontSize: 15,
          color: '#444',
          marginBottom: 12,
          whiteSpace: 'pre-line',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxHeight: 60,
          lineHeight: '1.4em',
        }}
        dangerouslySetInnerHTML={{
          __html:
            type === 'html'
              ? getFirstLines(post.content, 3)
              : (typeof window === 'undefined'
                  ? getFirstLines(post.content, 3)
                  : marked.parse(getFirstLines(post.content, 3))),
        }}
      />
      <div style={{ fontSize: 13, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
        <span>作者：{post.author}</span>
        <span>{new Date(post.created_at).toLocaleString()}</span>
        <span>回复：{post.reply_count}</span>
      </div>
    </div>
  );
}

// Helper function (ensure this exists in your file)
function getFirstLines(content: string, n: number) {
  return content.split('\n').slice(0, n).join('\n');
} 