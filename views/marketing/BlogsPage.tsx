import React, { useEffect, useState } from 'react';
import { BookOpen, Calendar } from 'lucide-react';
import { supabase } from '../../supabase';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string;
}

export const BlogsPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image_url, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-ink-800 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="pt-12 pb-10 text-center">
          <h1 className="font-display text-4xl md:text-[48px] font-bold text-ink-900 leading-[1.08] mb-4">Blogs</h1>
          <p className="text-ink-500 text-base max-w-xl mx-auto leading-relaxed">
            Guidance on booking smarter, understanding your prescriptions, and getting the most out of Dococlock.
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-ink-400 font-medium">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center bg-medical-50/60 rounded-ds-lg">
            <div className="w-14 h-14 rounded-full bg-white text-medical-500 flex items-center justify-center mb-4 shadow-ds-card">
              <BookOpen size={26} />
            </div>
            <h3 className="font-display text-xl font-bold text-ink-800 mb-2">No posts yet</h3>
            <p className="text-sm text-ink-500 max-w-xs">We're working on our first articles — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-ds-lg shadow-ds-card overflow-hidden flex flex-col">
                <div className="h-44 bg-medical-50">
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-6 flex flex-col gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500 uppercase tracking-wide">
                    <Calendar size={12} /> {new Date(post.published_at).toLocaleDateString()}
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink-800 leading-tight">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-ink-500 leading-relaxed">{post.excerpt}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
