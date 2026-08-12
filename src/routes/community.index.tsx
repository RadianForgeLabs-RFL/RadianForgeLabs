import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ExternalLink, Loader2, AlertCircle, Users, Clock, CheckCircle, X, Plus, Github, Eye, Smile, RefreshCw, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community - Radian Forge Labs" },
      { name: "description", content: "Join the Radian Forge Labs community discussions." },
      { property: "og:title", content: "Community - Radian Forge Labs" },
      { property: "og:description", content: "Join the Radian Forge Labs community discussions." },
    ],
  }),
  component: CommunityPage,
});

interface Discussion {
  id: string;
  number: number;
  title: string;
  author: string;
  createdAt: string;
  isAnswered: boolean;
  upvoteCount: number;
  commentCount: number;
  categoryName?: string;
  categoryId?: string;
}

function CommunityPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [allDiscussions, setAllDiscussions] = useState<Discussion[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; emoji: string; description: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', body: '', categoryId: '' });
  const [showLinkGithub, setShowLinkGithub] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Check if user has GitHub identity linked
  const hasGithubIdentity = user?.identities?.some((identity: any) => identity.provider === 'github');

  useEffect(() => {
    async function fetchDiscussions() {
      try {
        // Using GitHub GraphQL API to fetch organization discussions and categories
        const query = `
          query {
            organization(login: "RadianForgeLabs") {
              repositories(first: 10) {
                nodes {
                  discussions(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
                    nodes {
                      id
                      number
                      title
                      createdAt
                      author {
                        login
                      }
                      answerChosenAt
                      reactions {
                        totalCount
                      }
                      comments(first: 0) {
                        totalCount
                      }
                      category {
                        name
                        id
                        emoji
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`GitHub GraphQL API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract discussions and categories from all repositories
        let allDiscussions: Discussion[] = [];
        const categoryMap = new Map<string, { id: string; name: string; emoji: string; description: string }>();
        
        if (data.data?.organization?.repositories?.nodes) {
          data.data.organization.repositories.nodes.forEach((repo: any) => {
            if (repo.discussions?.nodes) {
              repo.discussions.nodes.forEach((d: any) => {
                // Add to discussions
                allDiscussions.push({
                  id: d.id,
                  number: d.number,
                  title: d.title,
                  author: d.author?.login || 'Unknown',
                  createdAt: d.createdAt,
                  isAnswered: d.answerChosenAt !== null,
                  upvoteCount: d.reactions?.totalCount || 0,
                  commentCount: d.comments?.totalCount || 0,
                  categoryName: d.category?.name || 'General',
                  categoryId: d.category?.id || ''
                });
                
                // Add to categories if not exists
                if (d.category && !categoryMap.has(d.category.id)) {
                  // Convert emoji shortcode to actual emoji if needed
                  let displayEmoji = d.category.emoji || '💬';
                  // GitHub returns emoji shortcodes like :video_game:, convert to actual emoji
                  const emojiMap: Record<string, string> = {
                    ':video_game:': '🎮',
                    ':speech_balloon:': '💬',
                    ':mega:': '📢',
                    ':bug:': '🐛',
                    ':bulb:': '💡',
                    ':art:': '🎨',
                    ':question:': '❓',
                    ':iphone:': '📱',
                    ':rocket:': '🚀',
                    ':book:': '📚',
                    ':star:': '⭐',
                    ':heart:': '❤️',
                    ':fire:': '🔥',
                    ':chart_with_upwards_trend:': '📈',
                    ':wrench:': '🔧',
                    ':globe:': '🌍',
                    ':computer:': '💻',
                    ':game_die:': '🎲',
                    ':musical_note:': '🎵',
                    ':film:': '🎬',
                  };
                  if (displayEmoji.startsWith(':') && displayEmoji.endsWith(':')) {
                    displayEmoji = emojiMap[displayEmoji] || '💬';
                  }
                  
                  categoryMap.set(d.category.id, {
                    id: d.category.id,
                    name: d.category.name,
                    emoji: displayEmoji,
                    description: `${d.category.name} discussions`
                  });
                }
              });
            }
          });
        }

        // Sort by date and take top 20
        allDiscussions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllDiscussions(allDiscussions.slice(0, 20));
        setDiscussions(allDiscussions.slice(0, 20));
        
        // Set categories from GitHub
        setCategories(Array.from(categoryMap.values()));
        
        // Fallback categories if none found
        if (categoryMap.size === 0) {
          setCategories([
            { id: "1", name: "Announcements", emoji: "📢", description: "Official announcements and updates" },
            { id: "2", name: "General", emoji: "💬", description: "General discussions" },
            { id: "3", name: "Games", emoji: "🎮", description: "Game discussions and feedback" },
            { id: "4", name: "Apps", emoji: "📱", description: "App discussions and support" },
            { id: "5", name: "Bugs", emoji: "🐛", description: "Bug reports and issues" },
            { id: "6", name: "Ideas", emoji: "💡", description: "Feature requests and ideas" },
            { id: "7", name: "Showcase", emoji: "🎨", description: "Share your projects and creations" },
            { id: "8", name: "Help", emoji: "❓", description: "Get help from the community" },
          ]);
        }
      } catch (err) {
        console.error('Error fetching discussions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load discussions');
        
        // Set fallback categories on error
        setCategories([
          { id: "1", name: "Announcements", emoji: "📢", description: "Official announcements and updates" },
          { id: "2", name: "General", emoji: "💬", description: "General discussions" },
          { id: "3", name: "Games", emoji: "🎮", description: "Game discussions and feedback" },
          { id: "4", name: "Apps", emoji: "📱", description: "App discussions and support" },
          { id: "5", name: "Bugs", emoji: "🐛", description: "Bug reports and issues" },
          { id: "6", name: "Ideas", emoji: "💡", description: "Feature requests and ideas" },
          { id: "7", name: "Showcase", emoji: "🎨", description: "Share your projects and creations" },
          { id: "8", name: "Help", emoji: "❓", description: "Get help from the community" },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiscussions();
  }, []);

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has GitHub identity linked
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Use GraphQL to create discussion
      const query = `
        mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
          createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body}) {
            discussion {
              id
              number
              title
            }
          }
        }
      `;

      // Get the first repository ID from discussions
      const repoId = discussions[0]?.id?.split('/')[0] || 'R_kgDOGxqJA'; // Default to RFL-Studios repo

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            repositoryId: repoId,
            categoryId: newDiscussion.categoryId,
            title: newDiscussion.title,
            body: newDiscussion.body,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create discussion');
      }

      const data = await response.json();
      
      // Refresh discussions
      setShowNewDiscussion(false);
      setNewDiscussion({ title: '', body: '', categoryId: '' });
      
      // Reload the page to show new discussion
      window.location.reload();
    } catch (err) {
      console.error('Error creating discussion:', err);
      alert('Failed to create discussion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'https://zndizxgtyigkjrqmpsqe.supabase.co/auth/v1/callback',
        scopes: 'read:user user:email'
      }
    });
    if (error) {
      console.error('Error linking GitHub:', error);
      alert('Failed to link GitHub account');
    }
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      setDiscussions(allDiscussions);
    } else {
      setDiscussions(allDiscussions.filter(d => d.categoryId === categoryId));
    }
  };

  const emojis = ['👍', '👎', '😄', '🎉', '❤️', '🔥', '🚀', '💡', '👀', '✅'];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Using GitHub GraphQL API to fetch organization discussions and categories
      const query = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussions(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
                  nodes {
                    id
                    number
                    title
                    createdAt
                    author {
                      login
                    }
                    answerChosenAt
                    reactions {
                      totalCount
                    }
                    comments(first: 0) {
                      totalCount
                    }
                    category {
                      name
                      id
                      emoji
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`GitHub GraphQL API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract discussions and categories from all repositories
      let allDiscussions: Discussion[] = [];
      const categoryMap = new Map<string, { id: string; name: string; emoji: string; description: string }>();
      
      if (data.data?.organization?.repositories?.nodes) {
        data.data.organization.repositories.nodes.forEach((repo: any) => {
          if (repo.discussions?.nodes) {
            repo.discussions.nodes.forEach((d: any) => {
              // Add to discussions
              allDiscussions.push({
                id: d.id,
                number: d.number,
                title: d.title,
                author: d.author?.login || 'Unknown',
                createdAt: d.createdAt,
                isAnswered: d.answerChosenAt !== null,
                upvoteCount: d.reactions?.totalCount || 0,
                commentCount: 0,
                categoryName: d.category?.name || 'General',
                categoryId: d.category?.id || ''
              });
              
              // Add to categories if not exists
              if (d.category && !categoryMap.has(d.category.id)) {
                let displayEmoji = d.category.emoji || '💬';
                
                // Extended emoji mapping for more categories
                const emojiMap: Record<string, string> = {
                  ':video_game:': '🎮',
                  ':speech_balloon:': '💬',
                  ':mega:': '📢',
                  ':bug:': '🐛',
                  ':bulb:': '💡',
                  ':art:': '🎨',
                  ':question:': '❓',
                  ':iphone:': '📱',
                  ':rocket:': '🚀',
                  ':book:': '📚',
                  ':star:': '⭐',
                  ':heart:': '❤️',
                  ':fire:': '🔥',
                  ':chart_with_upwards_trend:': '📈',
                  ':wrench:': '🔧',
                  ':globe:': '🌍',
                  ':computer:': '💻',
                  ':game_die:': '🎲',
                  ':musical_note:': '🎵',
                  ':film:': '🎬',
                  ':pencil2:': '✏️',
                  ':hammer:': '🔨',
                  ':construction:': '🚧',
                  ':warning:': '⚠️',
                  ':checkered_flag:': '🏁',
                  ':trophy:': '🏆',
                  ':gift:': '🎁',
                  ':tada:': '🎊',
                  ':sparkles:': '✨',
                  ':zap:': '⚡',
                  ':seedling:': '🌱',
                  ':deciduous_tree:': '🌳',
                  ':cloud:': '☁️',
                  ':snowflake:': '❄️',
                  ':ocean:': '🌊',
                  ':mountain:': '⛰️',
                  ':house:': '🏠',
                  ':office:': '🏢',
                };
                
                if (displayEmoji.startsWith(':') && displayEmoji.endsWith(':')) {
                  displayEmoji = emojiMap[displayEmoji] || '💬';
                }
                
                // Fallback emoji based on category name if emoji is still generic
                if (displayEmoji === '💬') {
                  const categoryName = d.category.name.toLowerCase();
                  if (categoryName.includes('game') || categoryName.includes('gaming')) {
                    displayEmoji = '🎮';
                  } else if (categoryName.includes('app') || categoryName.includes('mobile')) {
                    displayEmoji = '📱';
                  } else if (categoryName.includes('bug') || categoryName.includes('issue')) {
                    displayEmoji = '🐛';
                  } else if (categoryName.includes('idea') || categoryName.includes('feature')) {
                    displayEmoji = '💡';
                  } else if (categoryName.includes('announcement') || categoryName.includes('news')) {
                    displayEmoji = '📢';
                  } else if (categoryName.includes('help') || categoryName.includes('support')) {
                    displayEmoji = '❓';
                  } else if (categoryName.includes('showcase') || categoryName.includes('project')) {
                    displayEmoji = '🎨';
                  } else if (categoryName.includes('general')) {
                    displayEmoji = '💬';
                  } else if (categoryName.includes('entertainment')) {
                    displayEmoji = '🎮';
                  } else if (categoryName.includes('studio') || categoryName.includes('studios')) {
                    displayEmoji = '🏢';
                  } else if (categoryName.includes('download') || categoryName.includes('file')) {
                    displayEmoji = '📥';
                  }
                }
                
                categoryMap.set(d.category.id, {
                  id: d.category.id,
                  name: d.category.name,
                  emoji: displayEmoji,
                  description: `${d.category.name} discussions`
                });
              }
            });
          }
        });
      }

      // Sort by date and take top 20
      allDiscussions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllDiscussions(allDiscussions.slice(0, 20));
      
      // Apply current filter
      if (selectedCategory === null) {
        setDiscussions(allDiscussions.slice(0, 20));
      } else {
        setDiscussions(allDiscussions.filter(d => d.categoryId === selectedCategory));
      }
      
      // Update categories
      setCategories(Array.from(categoryMap.values()));
    } catch (err) {
      console.error('Error refreshing discussions:', err);
      alert('Failed to refresh discussions');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Community</h1>
        <p className="text-muted-foreground">Join discussions, share ideas, and connect with the community.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Categories */}
        <aside className="glass lg:sticky lg:top-24 h-fit rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Categories</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh categories and discussions"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <nav className="flex flex-col gap-2">
            <button 
              key="all"
              onClick={() => handleCategoryFilter(null)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedCategory === null 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="text-xl">📋</span>
              <div className="flex-1">
                <div className="font-medium">All Discussions</div>
                <div className="text-xs opacity-70">View all discussions</div>
              </div>
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => handleCategoryFilter(cat.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedCategory === cat.id 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1">
                  <div className="font-medium">{cat.name}</div>
                  <div className="text-xs opacity-70">{cat.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            {user ? (
              <Button size="sm" onClick={() => setShowNewDiscussion(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Discussion
              </Button>
            ) : (
              <Button asChild size="sm">
                <a href="/auth">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Login
                </a>
              </Button>
            )}
          </div>

          {showNewDiscussion && (
            <Card className="border border-white/5 bg-white/5 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Discussion</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowNewDiscussion(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleCreateDiscussion}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newDiscussion.title}
                      onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                      placeholder="What's on your mind?"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newDiscussion.categoryId} onValueChange={(value) => setNewDiscussion({ ...newDiscussion, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="body">Content</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <Smile className="h-4 w-4 mr-1" />
                          Emoji
                        </Button>
                      </div>
                    </div>
                    
                    {showEmojiPicker && (
                      <div className="flex flex-wrap gap-2 p-3 border border-white/10 rounded-lg glass shadow-xl">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewDiscussion({ ...newDiscussion, body: newDiscussion.body + emoji })}
                            className="text-2xl hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {showMarkdownPreview ? (
                      <div className="prose prose-invert max-w-none p-4 border border-white/10 rounded-lg bg-white/5 min-h-[150px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{newDiscussion.body || '*Preview will appear here*'}</ReactMarkdown>
                      </div>
                    ) : (
                      <Textarea
                        id="body"
                        value={newDiscussion.body}
                        onChange={(e) => setNewDiscussion({ ...newDiscussion, body: e.target.value })}
                        placeholder="Describe your discussion in detail... (Markdown supported)"
                        rows={6}
                        required
                      />
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Supports: **bold**, *italic*, `code`, [links](url), and more
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowNewDiscussion(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Discussion'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {showLinkGithub && (
            <Card className="border border-white/5 bg-white/5 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Link GitHub Account Required</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowLinkGithub(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To create discussions, you need to link your GitHub account. This allows us to post discussions on your behalf to the RadianForgeLabs GitHub repository.
                </p>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-white/5 bg-white/5">
                  <Github className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-medium">GitHub Account Linking</p>
                    <p className="text-xs text-muted-foreground">Required for creating discussions</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowLinkGithub(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleLinkGithub}>
                    <Github className="mr-2 h-4 w-4" />
                    Link GitHub Account
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {error && (
            <Card className="mb-6 border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-500">Unable to Load Discussions</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : discussions.length === 0 ? (
            <Card className="border border-white/5 bg-white/5 p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Discussions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to start a conversation in the community.
              </p>
              <Button variant="outline" asChild>
                <a href="https://github.com/orgs/RadianForgeLabs/discussions/new" target="_blank" rel="noopener noreferrer">
                  Start a Discussion
                </a>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {discussions.map((disc) => (
                <Card key={disc.id} className="border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                  <a href={`/community/${disc.number}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {disc.categoryName && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{disc.categoryName}</span>
                          )}
                          {disc.isAnswered && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1 hover:text-purple-400 transition-colors">{disc.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {disc.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(disc.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {disc.upvoteCount} reactions
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {disc.commentCount} replies
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in with GitHub to participate in discussions.
            </p>
            <Button variant="outline" asChild>
              <a href="https://github.com/orgs/RadianForgeLabs/discussions" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View All on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
