import { Card } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { newsQuery } from "@/lib/data";

export function NewsSection() {
  const { data: newsItems } = useQuery(newsQuery());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Studios': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Entertainment': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'Company': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Map slug to category (simple mapping based on slug prefix)
  const getCategoryFromSlug = (slug: string) => {
    if (slug.startsWith('studios') || slug.includes('dev')) return 'Studios';
    if (slug.startsWith('entertainment') || slug.includes('game')) return 'Entertainment';
    return 'Company';
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Latest News</h2>
        <p className="mt-2 text-muted-foreground">Stay updated with our latest announcements and updates.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(newsItems ?? []).map((item: any) => (
          <Card key={item.id} className="glass border-white/5 bg-transparent p-6 hover:border-primary/30 transition-colors">
            <div className="mb-4 flex items-center justify-between">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getCategoryColor(getCategoryFromSlug(item.slug))}`}>
                {getCategoryFromSlug(item.slug)}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(item.created_at)}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.excerpt}</p>
          </Card>
        ))}
        {newsItems?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No news available yet.
          </div>
        )}
      </div>
    </section>
  );
}
