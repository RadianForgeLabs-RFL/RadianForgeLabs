import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, ExternalLink, Loader2, AlertCircle, Send, ThumbsUp, CheckCircle, Clock, User, Edit2, Eye, EyeOff, Smile, Paperclip } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  body: string;
  createdAt: string;
  isAnswer?: boolean;
  upvoteCount: number;
}

interface DiscussionDetail {
  id: string;
  number: number;
  title: string;
  body: string;
  author: string;
  avatar: string;
  createdAt: string;
  categoryName: string;
  isAnswered: boolean;
  upvoteCount: number;
  commentCount: number;
}

export const Route = createFileRoute("/community/$number")({
  head: ({ params }) => ({
    meta: [
      { title: `Discussion #${params.number} - Radian Forge Labs Community` },
      { name: "description", content: "Read and join this Radian Forge Labs community discussion." },
      { property: "og:title", content: `Discussion #${params.number} - RFL Community` },
      { property: "og:description", content: "Read and join this Radian Forge Labs community discussion." },
    ],
  }),
  component: DiscussionPage,
});

function DiscussionPage() {
  const { number } = Route.useParams();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLinkGithub, setShowLinkGithub] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Check if user has GitHub identity linked
  const hasGithubIdentity = user?.identities?.some((identity: any) => identity.provider === 'github');

  useEffect(() => {
    async function fetchDiscussion() {
      try {
        // Using GitHub GraphQL API to fetch discussion details and comments
        const query = `
          query {
            organization(login: "RadianForgeLabs") {
              repositories(first: 10) {
                nodes {
                  discussion(number: ${number}) {
                    id
                    number
                    title
                    body
                    createdAt
                    author {
                      login
                      avatarUrl
                    }
                    category {
                      name
                    }
                    answerChosenAt
                    reactions {
                      totalCount
                    }
                    comments(first: 50) {
                      totalCount
                      nodes {
                        id
                        body
                        createdAt
                        author {
                          login
                          avatarUrl
                        }
                        isAnswer
                        reactions {
                          totalCount
                        }
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
        
        // Find the discussion in the response
        let foundDiscussion = null;
        let foundComments: Comment[] = [];
        
        if (data.data?.organization?.repositories?.nodes) {
          for (const repo of data.data.organization.repositories.nodes) {
            if (repo.discussion) {
              foundDiscussion = {
                id: repo.discussion.id,
                number: repo.discussion.number,
                title: repo.discussion.title,
                body: repo.discussion.body,
                author: repo.discussion.author?.login || 'Unknown',
                avatar: repo.discussion.author?.avatarUrl || '',
                createdAt: repo.discussion.createdAt,
                categoryName: repo.discussion.category?.name || 'General',
                isAnswered: repo.discussion.answerChosenAt !== null,
                upvoteCount: repo.discussion.reactions?.totalCount || 0,
                commentCount: repo.discussion.comments?.totalCount || 0,
              };
              
              if (repo.discussion.comments?.nodes) {
                foundComments = repo.discussion.comments.nodes.map((c: any) => ({
                  id: c.id,
                  author: c.author?.login || 'Unknown',
                  avatar: c.author?.avatarUrl || '',
                  body: c.body,
                  createdAt: c.createdAt,
                  isAnswer: c.isAnswer || false,
                  upvoteCount: c.reactions?.totalCount || 0,
                }));
              }
              break;
            }
          }
        }

        if (!foundDiscussion) {
          throw new Error('Discussion not found');
        }

        setDiscussion(foundDiscussion);
        setComments(foundComments);
      } catch (err) {
        console.error('Error fetching discussion:', err);
        setError(err instanceof Error ? err.message : 'Failed to load discussion');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiscussion();
  }, [number]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }
    
    if (!replyText.trim()) return;
    
    setIsSubmitting(true);

    try {
      // Using GraphQL to add comment
      const mutation = `
        mutation($discussionId: ID!, $body: String!) {
          addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
            comment {
              id
              body
              createdAt
              author {
                login
                avatarUrl
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
        body: JSON.stringify({
          query: mutation,
          variables: {
            discussionId: discussion?.id,
            body: replyText,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();
      
      // Refresh comments
      setReplyText('');
      
      // Reload the page to show new comment
      window.location.reload();
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment. Please try again.');
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

  const handleAddReaction = async (commentId: string, content: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    try {
      const mutation = `
        mutation($subjectId: ID!, $content: ReactionContent!) {
          addReaction(input: {subjectId: $subjectId, content: $content}) {
            reaction {
              content
            }
          }
        }
      `;

      await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            subjectId: commentId,
            content: content.toUpperCase(),
          },
        }),
      });

      window.location.reload();
    } catch (err) {
      console.error('Error adding reaction:', err);
      alert('Failed to add reaction');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!editText.trim()) return;

    try {
      const mutation = `
        mutation($commentId: ID!, $body: String!) {
          updateDiscussionComment(input: {commentId: $commentId, body: $body}) {
            comment {
              id
              body
            }
          }
        }
      `;

      await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            commentId: commentId,
            body: editText,
          },
        }),
      });

      setEditingCommentId(null);
      setEditText('');
      window.location.reload();
    } catch (err) {
      console.error('Error editing comment:', err);
      alert('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const mutation = `
        mutation($commentId: ID!) {
          deleteDiscussionComment(input: {commentId: $commentId}) {
            clientMutationId
          }
        }
      `;

      await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            commentId: commentId,
          },
        }),
      });

      window.location.reload();
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const emojis = ['👍', '👎', '😄', '🎉', '❤️', '🔥', '🚀', '💡', '👀', '✅'];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link to="/community">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to community
            </Button>
          </Link>
        </div>
        <Card className="border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">Discussion Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'This discussion could not be found.'}</p>
          <Button asChild>
            <a href={`https://github.com/orgs/RadianForgeLabs/discussions/${number}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link to="/community">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to community
          </Button>
        </Link>
      </div>

      {/* Discussion Header */}
      <Card className="border border-white/5 bg-white/5 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={discussion.avatar}
            alt={discussion.author}
            className="h-12 w-12 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{discussion.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{discussion.author}</span>
              <span>•</span>
              <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="px-2 py-1 rounded bg-white/5">{discussion.categoryName}</span>
            </div>
          </div>
        </div>
        
        <div className="prose prose-invert max-w-none mb-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{discussion.body}</ReactMarkdown>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ThumbsUp className="h-4 w-4" />
            <span>{discussion.upvoteCount} reactions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{discussion.commentCount} comments</span>
          </div>
          {discussion.isAnswered && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span>Answered</span>
            </div>
          )}
        </div>
      </Card>

      {/* Comments Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Comments ({comments.length})</h2>
        
        {/* Reply Form */}
        <Card className="border border-white/5 bg-white/5 p-4 mb-6">
          <form onSubmit={handleReply}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="reply">Your reply</Label>
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
                <div className="flex flex-wrap gap-2 p-3 border border-white/10 rounded-lg bg-white/5">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setReplyText(replyText + emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {showMarkdownPreview ? (
                <div className="prose prose-invert max-w-none p-4 border border-white/10 rounded-lg bg-white/5 min-h-[100px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{replyText || '*Preview will appear here*'}</ReactMarkdown>
                </div>
              ) : (
                <Textarea
                  id="reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply... (Markdown supported)"
                  rows={4}
                  required
                />
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Supports: **bold**, *italic*, `code`, [links](url), and more
                </div>
                <Button type="submit" disabled={isSubmitting || !replyText.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {showLinkGithub && (
          <Card className="border border-white/5 bg-white/5 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Link GitHub Account Required</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLinkGithub(false)}>
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To reply to discussions, you need to link your GitHub account.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLinkGithub(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLinkGithub}>
                  Link GitHub Account
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className={`border border-white/5 bg-white/5 p-4 ${comment.isAnswer ? 'border-green-500/30 bg-green-500/5' : ''}`}>
              <div className="flex items-start gap-3">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="h-8 w-8 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {comment.isAnswer && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-500">
                        ✓ Answer
                      </span>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(null); setEditText(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="prose prose-invert max-w-none text-sm mb-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{comment.upvoteCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {emojis.slice(0, 5).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(comment.id, emoji)}
                              className="hover:scale-125 transition-transform"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        {hasGithubIdentity && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => { setEditingCommentId(comment.id); setEditText(comment.body); }}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-red-500 hover:text-red-400"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <EyeOff className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {comments.length === 0 && (
            <Card className="border border-white/5 bg-white/5 p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No comments yet. Be the first to reply!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
