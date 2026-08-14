import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, ExternalLink, Loader2, AlertCircle, Send, ThumbsUp, CheckCircle, Clock, User, Edit2, Eye, EyeOff, Smile, Paperclip, Upload, Trash2, Bell, BellOff, Plus, X } from "lucide-react";
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
  isHidden?: boolean;
  replyTo?: string;
  replies?: Comment[];
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showDiscussionEmojiPicker, setShowDiscussionEmojiPicker] = useState(false);
  const [showHiddenContent, setShowHiddenContent] = useState(false);
  const [isMaintainer, setIsMaintainer] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyToText, setReplyToText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplyMarkdownPreview, setShowReplyMarkdownPreview] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [uploadingReplyFile, setUploadingReplyFile] = useState(false);

  // Check if user has GitHub identity linked
  const hasGithubIdentity = user?.identities?.some((identity: any) => identity.provider === 'github');

  // Fetch user permissions for the repository
  useEffect(() => {
    async function fetchUserPermissions() {
      if (!hasGithubIdentity || !user) return;

      try {
        const query = `
          query {
            organization(login: "RadianForgeLabs") {
              repositories(first: 10) {
                nodes {
                  name
                  viewerPermission
                }
              }
            }
            viewer {
              login
            }
          }
        `;

        const response = await fetch('/api/github-graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (response.ok) {
          const data = await response.json();
          const permissions = data.data?.organization?.repositories?.nodes?.map((repo: any) => repo.viewerPermission) || [];
          setUserPermissions(permissions);
          
          // Check if user has admin or maintain permission on any repository
          const hasMaintainerAccess = permissions.some((perm: string) => 
            perm === 'ADMIN' || perm === 'MAINTAIN' || perm === 'WRITE'
          );
          setIsMaintainer(hasMaintainerAccess);
        }
      } catch (err) {
        console.error('Error fetching user permissions:', err);
      }
    }

    fetchUserPermissions();
  }, [hasGithubIdentity, user]);

  // Track view count
  useEffect(() => {
    async function trackView() {
      if (!discussion) return;

      try {
        // Insert view record
        if (user?.id) {
          await (supabase as any)
            .from('discussion_views')
            .insert({
              discussion_id: discussion.id,
              user_id: user.id,
            });
        } else {
          // Track by IP for anonymous users (simplified)
          await (supabase as any)
            .from('discussion_views')
            .insert({
              discussion_id: discussion.id,
              ip_address: 'anonymous',
            });
        }

        // Get total view count
        const { count } = await supabase
          .from('discussion_views')
          .select('*', { count: 'exact', head: true })
          .eq('discussion_id', discussion.id);

        setViewCount(count || 0);
      } catch (err) {
        // Ignore duplicate errors
        console.error('Error tracking view:', err);
      }
    }

    trackView();
  }, [discussion, user]);

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
                    comments(first: 100) {
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
                        replyTo {
                          id
                          author {
                            login
                          }
                        }
                        replies(first: 50) {
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
                            replyTo {
                              id
                              author {
                                login
                              }
                            }
                          }
                        }
                      }
                    }
                    answer {
                      id
                      author {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('/api/github-graphql', {
          method: 'POST',
          headers: {
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
                const answerId = repo.discussion.answer?.id;
                console.log('Fetched comments from GitHub:', repo.discussion.comments.nodes.length);
                console.log('Comments with replyTo:', repo.discussion.comments.nodes.filter((c: any) => c.replyTo).length);
                console.log('Comments with replies field:', repo.discussion.comments.nodes.filter((c: any) => c.replies?.nodes?.length > 0).length);
                
                foundComments = repo.discussion.comments.nodes.map((c: any) => ({
                  id: c.id,
                  author: c.author?.login || 'Unknown',
                  avatar: c.author?.avatarUrl || '',
                  body: c.body,
                  createdAt: c.createdAt,
                  isAnswer: c.id === answerId || c.isAnswer || false,
                  upvoteCount: c.reactions?.totalCount || 0,
                  replyTo: c.replyTo?.id || null,
                  replies: [],
                }));

                // Process nested replies from the API
                repo.discussion.comments.nodes.forEach((c: any) => {
                  if (c.replies?.nodes) {
                    console.log(`Comment ${c.id} has ${c.replies.nodes.length} nested replies from API`);
                    c.replies.nodes.forEach((reply: any) => {
                      foundComments.push({
                        id: reply.id,
                        author: reply.author?.login || 'Unknown',
                        avatar: reply.author?.avatarUrl || '',
                        body: reply.body,
                        createdAt: reply.createdAt,
                        isAnswer: reply.id === answerId || reply.isAnswer || false,
                        upvoteCount: reply.reactions?.totalCount || 0,
                        replyTo: reply.replyTo?.id || c.id,
                        replies: [],
                      });
                    });
                  }
                });

                console.log('Total comments after processing nested replies:', foundComments.length);

                // Organize comments into nested structure
                const topLevelComments: Comment[] = [];
                const commentsMap = new Map<string, Comment>(foundComments.map(c => [c.id, c]));

                // Helper function to recursively add replies
                const addReplyToParent = (comment: Comment, allComments: Comment[]): void => {
                  if (!comment.replyTo) {
                    topLevelComments.push(comment);
                    return;
                  }

                  const parentComment = commentsMap.get(comment.replyTo);
                  if (parentComment) {
                    (parentComment as any).replies = (parentComment as any).replies || [];
                    (parentComment as any).replies.push(comment);
                  } else {
                    // Parent not found, add as top-level
                    topLevelComments.push(comment);
                  }
                };

                foundComments.forEach(comment => {
                  addReplyToParent(comment, foundComments);
                });

                foundComments = topLevelComments;

                // Debug: Log comment structure
                console.log('Top-level comments:', topLevelComments.length);
                topLevelComments.forEach(c => {
                  console.log(`Comment ${c.id} has ${(c as any).replies?.length || 0} replies`);
                });
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
        
        // Check follow status from Supabase
        if (user?.id) {
          try {
            const { data: followData, error: followError } = await (supabase as any)
              .from('discussion_follows')
              .select('*')
              .eq('discussion_id', foundDiscussion.id)
              .eq('user_id', user.id)
              .maybeSingle();
            setIsFollowing(!!followData);
          } catch (followErr) {
            console.error('Error checking follow status:', followErr);
            setIsFollowing(false);
          }
        }
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

      const response = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
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
      
      // Add new comment to local state
      if (data.data?.addDiscussionComment?.comment) {
        const newComment = data.data.addDiscussionComment.comment;
        setComments([
          {
            id: newComment.id,
            author: newComment.author?.login || user?.user_metadata?.user_name || 'Unknown',
            avatar: newComment.author?.avatarUrl || user?.user_metadata?.avatar_url || '',
            body: newComment.body,
            createdAt: newComment.createdAt,
            upvoteCount: 0,
          },
          ...comments
        ]);
      }
      
      setReplyText('');
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

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
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

      // Refetch discussion to sync with GitHub state
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  reactions {
                    totalCount
                  }
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                      replies(first: 50) {
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
                          replyTo {
                            id
                            author {
                              login
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData) {
          // Update discussion upvote count
          setDiscussion((prev) => prev ? {
            ...prev,
            upvoteCount: discussionData.reactions?.totalCount || 0,
          } : prev);

          // Update comments
          if (discussionData.comments?.nodes) {
            const answerId = discussionData.answer?.id;
            const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
              id: c.id,
              author: c.author?.login || 'Unknown',
              avatar: c.author?.avatarUrl || '',
              body: c.body,
              createdAt: c.createdAt,
              isAnswer: c.id === answerId || c.isAnswer || false,
              upvoteCount: c.reactions?.totalCount || 0,
              replyTo: c.replyTo?.id || null,
              replies: [],
            }));

            // Process nested replies from the API
            discussionData.comments.nodes.forEach((c: any) => {
              if (c.replies?.nodes) {
                c.replies.nodes.forEach((reply: any) => {
                  fetchedComments.push({
                    id: reply.id,
                    author: reply.author?.login || 'Unknown',
                    avatar: reply.author?.avatarUrl || '',
                    body: reply.body,
                    createdAt: reply.createdAt,
                    isAnswer: reply.id === answerId || reply.isAnswer || false,
                    upvoteCount: reply.reactions?.totalCount || 0,
                    replyTo: reply.replyTo?.id || c.id,
                    replies: [],
                  });
                });
              }
            });

            // Organize comments into nested structure
            const topLevelComments: Comment[] = [];
            const commentsMap = new Map(fetchedComments.map((c: Comment) => [c.id, c]));

            fetchedComments.forEach((comment: Comment) => {
              if (comment.replyTo) {
                const parentComment = commentsMap.get(comment.replyTo);
                if (parentComment) {
                  (parentComment as any).replies = (parentComment as any).replies || [];
                  (parentComment as any).replies.push(comment);
                }
              } else {
                topLevelComments.push(comment);
              }
            });

            setComments(topLevelComments);
          }
        }
      }
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

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
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

      // Refetch discussion to sync with GitHub state
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  answerChosenAt
                  answer {
                    id
                  }
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                      replies(first: 50) {
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
                          replyTo {
                            id
                            author {
                              login
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData) {
          // Update discussion answered status
          setDiscussion((prev) => prev ? {
            ...prev,
            isAnswered: discussionData.answerChosenAt !== null,
          } : prev);

          // Update comments
          if (discussionData.comments?.nodes) {
            const answerId = discussionData.answer?.id;
            const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
              id: c.id,
              author: c.author?.login || 'Unknown',
              avatar: c.author?.avatarUrl || '',
              body: c.body,
              createdAt: c.createdAt,
              isAnswer: c.id === answerId || c.isAnswer || false,
              upvoteCount: c.reactions?.totalCount || 0,
              replyTo: c.replyTo?.id || null,
              replies: [],
            }));

            // Process nested replies from the API
            discussionData.comments.nodes.forEach((c: any) => {
              if (c.replies?.nodes) {
                c.replies.nodes.forEach((reply: any) => {
                  fetchedComments.push({
                    id: reply.id,
                    author: reply.author?.login || 'Unknown',
                    avatar: reply.author?.avatarUrl || '',
                    body: reply.body,
                    createdAt: reply.createdAt,
                    isAnswer: reply.id === answerId || reply.isAnswer || false,
                    upvoteCount: reply.reactions?.totalCount || 0,
                    replyTo: reply.replyTo?.id || c.id,
                    replies: [],
                  });
                });
              }
            });

            // Organize comments into nested structure
            const topLevelComments: Comment[] = [];
            const commentsMap = new Map(fetchedComments.map((c: Comment) => [c.id, c]));

            fetchedComments.forEach((comment: Comment) => {
              if (comment.replyTo) {
                const parentComment = commentsMap.get(comment.replyTo);
                if (parentComment) {
                  (parentComment as any).replies = (parentComment as any).replies || [];
                  (parentComment as any).replies.push(comment);
                }
              } else {
                topLevelComments.push(comment);
              }
            });

            setComments(topLevelComments);
          }
        }
      }

      setEditingCommentId(null);
      setEditText('');
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

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            commentId: commentId,
          },
        }),
      });

      // Refetch discussion to sync with GitHub state
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                      replies(first: 50) {
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
                          replyTo {
                            id
                            author {
                              login
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData?.comments?.nodes) {
          const answerId = discussionData.answer?.id;
          const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
            id: c.id,
            author: c.author?.login || 'Unknown',
            avatar: c.author?.avatarUrl || '',
            body: c.body,
            createdAt: c.createdAt,
            isAnswer: c.id === answerId || c.isAnswer || false,
            upvoteCount: c.reactions?.totalCount || 0,
            replyTo: c.replyTo?.id || null,
            replies: [],
          }));

          // Process nested replies from the API
          discussionData.comments.nodes.forEach((c: any) => {
            if (c.replies?.nodes) {
              c.replies.nodes.forEach((reply: any) => {
                fetchedComments.push({
                  id: reply.id,
                  author: reply.author?.login || 'Unknown',
                  avatar: reply.author?.avatarUrl || '',
                  body: reply.body,
                  createdAt: reply.createdAt,
                  isAnswer: reply.id === answerId || reply.isAnswer || false,
                  upvoteCount: reply.reactions?.totalCount || 0,
                  replyTo: reply.replyTo?.id || c.id,
                  replies: [],
                });
              });
            }
          });

          // Organize comments into nested structure
          const topLevelComments: Comment[] = [];
          const commentsMap = new Map(fetchedComments.map((c: Comment) => [c.id, c]));

          fetchedComments.forEach((comment: Comment) => {
            if (comment.replyTo) {
              const parentComment = commentsMap.get(comment.replyTo);
              if (parentComment) {
                (parentComment as any).replies = (parentComment as any).replies || [];
                (parentComment as any).replies.push(comment);
              }
            } else {
              topLevelComments.push(comment);
            }
          });

          setComments(topLevelComments);
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const handleHideComment = async (commentId: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can hide comments.');
      return;
    }

    if (!confirm('Are you sure you want to hide this comment?')) return;

    try {
      const mutation = `
        mutation($commentId: ID!) {
          hideDiscussionComment(input: {commentId: $commentId}) {
            clientMutationId
          }
        }
      `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            commentId: commentId,
          },
        }),
      });

      // Refetch discussion to sync with GitHub state
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                      replies(first: 50) {
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
                          replyTo {
                            id
                            author {
                              login
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData?.comments?.nodes) {
          const answerId = discussionData.answer?.id;
          const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
            id: c.id,
            author: c.author?.login || 'Unknown',
            avatar: c.author?.avatarUrl || '',
            body: c.body,
            createdAt: c.createdAt,
            isAnswer: c.id === answerId || c.isAnswer || false,
            upvoteCount: c.reactions?.totalCount || 0,
            replyTo: c.replyTo?.id || null,
            replies: [],
          }));

          // Process nested replies from the API
          discussionData.comments.nodes.forEach((c: any) => {
            if (c.replies?.nodes) {
              c.replies.nodes.forEach((reply: any) => {
                fetchedComments.push({
                  id: reply.id,
                  author: reply.author?.login || 'Unknown',
                  avatar: reply.author?.avatarUrl || '',
                  body: reply.body,
                  createdAt: reply.createdAt,
                  isAnswer: reply.id === answerId || reply.isAnswer || false,
                  upvoteCount: reply.reactions?.totalCount || 0,
                  replyTo: reply.replyTo?.id || c.id,
                  replies: [],
                });
              });
            }
          });

          // Organize comments into nested structure
          const topLevelComments: Comment[] = [];
          const commentsMap = new Map(fetchedComments.map((c: Comment) => [c.id, c]));

          fetchedComments.forEach((comment: Comment) => {
            if (comment.replyTo) {
              const parentComment = commentsMap.get(comment.replyTo);
              if (parentComment) {
                (parentComment as any).replies = (parentComment as any).replies || [];
                (parentComment as any).replies.push(comment);
              }
            } else {
              topLevelComments.push(comment);
            }
          });

          setComments(topLevelComments);
        }
      }
    } catch (err) {
      console.error('Error hiding comment:', err);
      alert('Failed to hide comment');
    }
  };

  const handleUnhideComment = async (commentId: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can unhide comments.');
      return;
    }

    try {
      const mutation = `
        mutation($commentId: ID!) {
          unhideDiscussionComment(input: {commentId: $commentId}) {
            clientMutationId
          }
        }
      `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            commentId: commentId,
          },
        }),
      });

      // Refetch discussion to sync with GitHub state
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                      replies(first: 50) {
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
                          replyTo {
                            id
                            author {
                              login
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData?.comments?.nodes) {
          const answerId = discussionData.answer?.id;
          const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
            id: c.id,
            author: c.author?.login || 'Unknown',
            avatar: c.author?.avatarUrl || '',
            body: c.body,
            createdAt: c.createdAt,
            isAnswer: c.id === answerId || c.isAnswer || false,
            upvoteCount: c.reactions?.totalCount || 0,
            replyTo: c.replyTo?.id || null,
            replies: [],
          }));

          // Process nested replies from the API
          discussionData.comments.nodes.forEach((c: any) => {
            if (c.replies?.nodes) {
              c.replies.nodes.forEach((reply: any) => {
                fetchedComments.push({
                  id: reply.id,
                  author: reply.author?.login || 'Unknown',
                  avatar: reply.author?.avatarUrl || '',
                  body: reply.body,
                  createdAt: reply.createdAt,
                  isAnswer: reply.id === answerId || reply.isAnswer || false,
                  upvoteCount: reply.reactions?.totalCount || 0,
                  replyTo: reply.replyTo?.id || c.id,
                  replies: [],
                });
              });
            }
          });

          // Organize comments into nested structure
          const topLevelComments: Comment[] = [];
          const commentsMap = new Map(fetchedComments.map((c: Comment) => [c.id, c]));

          fetchedComments.forEach((comment: Comment) => {
            if (comment.replyTo) {
              const parentComment = commentsMap.get(comment.replyTo);
              if (parentComment) {
                (parentComment as any).replies = (parentComment as any).replies || [];
                (parentComment as any).replies.push(comment);
              }
            } else {
              topLevelComments.push(comment);
            }
          });

          setComments(topLevelComments);
        }
      }
    } catch (err) {
      console.error('Error unhiding comment:', err);
      alert('Failed to unhide comment');
    }
  };

  const handleMarkAsAnswer = async (commentId: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can mark comments as answers.');
      return;
    }

    if (!confirm('Are you sure you want to mark this comment as the answer?')) return;

    if (!discussion) {
      alert('Discussion not found');
      return;
    }

    try {
      const mutation = `
        mutation($discussionId: ID!, $commentId: ID!) {
          markDiscussionCommentAsAnswer(input: {discussionId: $discussionId, commentId: $commentId}) {
            discussion {
              id
              answer {
                id
              }
            }
          }
        }
      `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            discussionId: discussion.id,
            commentId: commentId,
          },
        }),
      });

      // Refetch discussion to sync with GitHub state
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  answerChosenAt
                  answer {
                    id
                  }
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                      replies(first: 50) {
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
                          replyTo {
                            id
                            author {
                              login
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData) {
          // Update discussion answered status
          setDiscussion((prev) => prev ? {
            ...prev,
            isAnswered: discussionData.answerChosenAt !== null,
          } : prev);

          // Update comments
          if (discussionData.comments?.nodes) {
            const answerId = discussionData.answer?.id;
            const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
              id: c.id,
              author: c.author?.login || 'Unknown',
              avatar: c.author?.avatarUrl || '',
              body: c.body,
              createdAt: c.createdAt,
              isAnswer: c.id === answerId || c.isAnswer || false,
              upvoteCount: c.reactions?.totalCount || 0,
              replyTo: c.replyTo?.id || null,
              replies: [],
            }));

            // Organize comments into nested structure
            const topLevelComments: Comment[] = [];
            const commentsMap = new Map(fetchedComments.map((c: Comment) => [c.id, c]));

            fetchedComments.forEach((comment: Comment) => {
              if (comment.replyTo) {
                const parentComment = commentsMap.get(comment.replyTo);
                if (parentComment) {
                  (parentComment as any).replies = (parentComment as any).replies || [];
                  (parentComment as any).replies.push(comment);
                }
              } else {
                topLevelComments.push(comment);
              }
            });

            setComments(topLevelComments);
          }
        }
      }
    } catch (err) {
      console.error('Error marking as answer:', err);
      alert('Failed to mark as answer');
    }
  };

  const handleUnmarkAsAnswer = async (commentId?: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can unmark comments as answers.');
      return;
    }

    if (!discussion) {
      alert('Discussion not found');
      return;
    }

    try {
      const mutation = `
        mutation($discussionId: ID!) {
          unmarkDiscussionCommentAsAnswer(input: {discussionId: $discussionId}) {
            discussion {
              id
              answer {
                id
              }
            }
          }
        }
      `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            discussionId: discussion.id,
          },
        }),
      });

      // Refetch discussion to sync with GitHub state
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  answerChosenAt
                  answer {
                    id
                  }
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                      replies(first: 50) {
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
                          replyTo {
                            id
                            author {
                              login
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData) {
          // Update discussion answered status
          setDiscussion((prev) => prev ? {
            ...prev,
            isAnswered: discussionData.answerChosenAt !== null,
          } : prev);

          // Update comments
          if (discussionData.comments?.nodes) {
            const answerId = discussionData.answer?.id;
            const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
              id: c.id,
              author: c.author?.login || 'Unknown',
              avatar: c.author?.avatarUrl || '',
              body: c.body,
              createdAt: c.createdAt,
              isAnswer: c.id === answerId || c.isAnswer || false,
              upvoteCount: c.reactions?.totalCount || 0,
              replyTo: c.replyTo?.id || null,
              replies: [],
            }));

            // Organize comments into nested structure
            const topLevelComments: Comment[] = [];
            const commentsMap = new Map(fetchedComments.map((c: Comment) => [c.id, c]));

            fetchedComments.forEach((comment: Comment) => {
              if (comment.replyTo) {
                const parentComment = commentsMap.get(comment.replyTo);
                if (parentComment) {
                  (parentComment as any).replies = (parentComment as any).replies || [];
                  (parentComment as any).replies.push(comment);
                }
              } else {
                topLevelComments.push(comment);
              }
            });

            setComments(topLevelComments);
          }
        }
      }
    } catch (err) {
      console.error('Error unmarking as answer:', err);
      alert('Failed to unmark as answer');
    }
  };

  const handleFollowDiscussion = async () => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!discussion) return;

    try {
      console.log('Toggling follow for discussion:', discussion.id, 'User:', user?.id);
      
      // GitHub GraphQL API doesn't have follow/unfollow mutations for discussions
      // We'll track this locally in Supabase instead
      const { data: existingFollow, error: checkError } = await (supabase as any)
        .from('discussion_follows')
        .select('*')
        .eq('discussion_id', discussion.id)
        .eq('user_id', user?.id)
        .single();

      console.log('Existing follow check:', existingFollow, checkError);

      if (existingFollow) {
        const { error: deleteError } = await (supabase as any)
          .from('discussion_follows')
          .delete()
          .eq('discussion_id', discussion.id)
          .eq('user_id', user?.id);
        
        console.log('Delete follow error:', deleteError);
        if (!deleteError) {
          setIsFollowing(false);
        }
      } else {
        const { error: insertError } = await (supabase as any)
          .from('discussion_follows')
          .insert({
            discussion_id: discussion.id,
            user_id: user?.id,
          });
        
        console.log('Insert follow error:', insertError);
        if (!insertError) {
          setIsFollowing(true);
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Failed to update follow status');
    }
  };

  const handleReplyToComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }
    
    if (!replyToText.trim() || !replyingTo) return;
    
    setIsSubmittingReply(true);

    try {
      // Using GraphQL to add comment with replyTo
      const mutation = `
        mutation($discussionId: ID!, $body: String!, $replyToId: ID!) {
          addDiscussionComment(input: {discussionId: $discussionId, body: $body, replyToId: $replyToId}) {
            comment {
              id
              body
              createdAt
              author {
                login
                avatarUrl
              }
              replyTo {
                id
                author {
                  login
                }
              }
            }
          }
        }
      `;

      const response = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            discussionId: discussion?.id,
            body: replyToText,
            replyToId: replyingTo,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      // Refetch all comments from GitHub to ensure UI is in sync
      const fetchQuery = `
        query {
          organization(login: "RadianForgeLabs") {
            repositories(first: 10) {
              nodes {
                discussion(number: ${number}) {
                  id
                  answerChosenAt
                  answer {
                    id
                  }
                  comments(first: 100) {
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
                      replyTo {
                        id
                        author {
                          login
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const fetchResponse = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fetchQuery }),
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const discussionData = fetchData.data?.organization?.repositories?.nodes
          .find((r: any) => r.discussion)?.discussion;

        if (discussionData) {
          // Update discussion answered status
          setDiscussion((prev) => prev ? {
            ...prev,
            isAnswered: discussionData.answerChosenAt !== null,
          } : prev);

          // Update comments
          if (discussionData.comments?.nodes) {
            const answerId = discussionData.answer?.id;
            const fetchedComments = discussionData.comments.nodes.map((c: any) => ({
              id: c.id,
              author: c.author?.login || 'Unknown',
              avatar: c.author?.avatarUrl || '',
              body: c.body,
              createdAt: c.createdAt,
              isAnswer: c.id === answerId || c.isAnswer || false,
              upvoteCount: c.reactions?.totalCount || 0,
              replyTo: c.replyTo?.id || null,
              replies: [],
            }));

            console.log('After refetch - Total comments:', fetchedComments.length);
            console.log('After refetch - Comments with replyTo:', fetchedComments.filter((c: any) => c.replyTo).length);
            console.log('After refetch - Comments without replyTo:', fetchedComments.filter((c: any) => !c.replyTo).length);
            fetchedComments.forEach((c: any) => {
              console.log(`Comment ${c.id}: replyTo=${c.replyTo}, author=${c.author}`);
            });

            setComments(fetchedComments);
          }
        }
      }
      
      setReplyToText('');
      setReplyingTo(null);
      setShowReplyForm(false);
      setShowReplyMarkdownPreview(false);
      setShowReplyEmojiPicker(false);
    } catch (err) {
      console.error('Error posting reply:', err);
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleReplyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReplyFile(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `community-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      // Insert markdown image syntax into reply
      const imageMarkdown = `
![${file.name}](${publicUrl})
`;
      setReplyToText(replyToText + imageMarkdown);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingReplyFile(false);
    }
  };

  const emojis = ['👍', '👎', '😄', '🎉', '❤️', '🔥', '🚀', '💡', '👀', '✅'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `community-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      // Insert markdown image syntax into reply
      const imageMarkdown = `
![${file.name}](${publicUrl})
`;
      setReplyText(replyText + imageMarkdown);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

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
              {/* Show answered status for Q&A/Bug categories */}
              {(discussion.categoryName?.toLowerCase().includes('q&a') || 
                discussion.categoryName?.toLowerCase().includes('bug') ||
                discussion.categoryName?.toLowerCase().includes('question') ||
                discussion.categoryName?.toLowerCase().includes('help')) && (
                <>
                  {discussion.isAnswered ? (
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs">Answered</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs">Not Answered</span>
                  )}
                </>
              )}
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{viewCount} views</span>
          </div>
          {discussion.isAnswered && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span>Answered</span>
              {/* Only show Unmark Answer button for bug reports/Q&A categories */}
              {(discussion.categoryName.toLowerCase().includes('bug') || 
                discussion.categoryName.toLowerCase().includes('q&a') ||
                discussion.categoryName.toLowerCase().includes('question') ||
                discussion.categoryName.toLowerCase().includes('help')) && hasGithubIdentity && isMaintainer && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-green-600 hover:text-green-500"
                  onClick={() => handleUnmarkAsAnswer(discussion.id)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Unmark Answer
                </Button>
              )}
            </div>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFollowDiscussion}
            className="text-muted-foreground hover:text-foreground"
          >
            {isFollowing ? (
              <>
                <BellOff className="h-4 w-4 mr-1" />
                Unfollow
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-1" />
                Follow
              </>
            )}
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('React button clicked, current state:', showDiscussionEmojiPicker);
                setShowDiscussionEmojiPicker(!showDiscussionEmojiPicker);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-4 w-4 mr-1" />
              React
            </Button>
            {showDiscussionEmojiPicker && (
              <div className="absolute right-0 top-full mt-2 flex flex-wrap gap-2 p-3 border border-white/10 rounded-lg glass z-10 w-48 shadow-xl">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleAddReaction(discussion.id, emoji);
                      setShowDiscussionEmojiPicker(false);
                    }}
                    className="text-2xl hover:scale-125 transition-transform"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
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
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx"
                      disabled={uploadingFile}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Paperclip className="h-4 w-4 mr-1" />
                          Attach File
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {showEmojiPicker && (
                <div className="flex flex-wrap gap-2 p-3 border border-white/10 rounded-lg glass shadow-xl">
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

        {/* Comments List - Only show top-level comments */}
        <div className="space-y-4">
          {comments.filter((c: any) => !(c as any).replyTo).map((comment) => (
            <Card key={comment.id} className={`border border-white/5 bg-white/5 p-4 ${comment.isAnswer ? 'border-green-500/30 bg-green-500/5' : ''} ${comment.isHidden ? 'opacity-50' : ''}`}>
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
                    {comment.isHidden && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-500">
                        Hidden
                      </span>
                    )}
                  </div>
                  
                  {comment.isHidden && !showHiddenContent ? (
                    <div className="text-sm text-muted-foreground italic mb-3">
                      This comment has been hidden. 
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 ml-2"
                        onClick={() => setShowHiddenContent(true)}
                      >
                        Show content
                      </Button>
                    </div>
                  ) : (
                    <>
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
                            {/* Only show Reply button for bug reports/Q&A categories */}
                            {(discussion.categoryName.toLowerCase().includes('bug') || 
                              discussion.categoryName.toLowerCase().includes('q&a') ||
                              discussion.categoryName.toLowerCase().includes('question') ||
                              discussion.categoryName.toLowerCase().includes('help')) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => { setReplyingTo(comment.id); setShowReplyForm(true); }}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                            )}
                            {hasGithubIdentity && isMaintainer && (
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
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                                {comment.isHidden ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-green-600 hover:text-green-500"
                                    onClick={() => handleUnhideComment(comment.id)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Unhide
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-yellow-600 hover:text-yellow-500"
                                    onClick={() => handleHideComment(comment.id)}
                                  >
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide
                                  </Button>
                                )}
                                {/* Only show Mark Answer for bug reports/Q&A categories */}
                                {(discussion.categoryName.toLowerCase().includes('bug') || 
                                  discussion.categoryName.toLowerCase().includes('q&a') ||
                                  discussion.categoryName.toLowerCase().includes('question') ||
                                  discussion.categoryName.toLowerCase().includes('help')) && (
                                  <>
                                    {comment.isAnswer ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-green-600 hover:text-green-500"
                                        onClick={() => handleUnmarkAsAnswer(comment.id)}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Unmark Answer
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-purple-600 hover:text-purple-500"
                                        onClick={() => handleMarkAsAnswer(comment.id)}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Mark Answer
                                      </Button>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {showReplyForm && replyingTo === comment.id && (
                <Card className="border border-white/10 bg-white/5 p-4 ml-11 mt-3">
                  <form onSubmit={handleReplyToComment}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reply-to">Your reply</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReplyMarkdownPreview(!showReplyMarkdownPreview)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                          >
                            <Smile className="h-4 w-4 mr-1" />
                            Emoji
                          </Button>
                          <div className="relative">
                            <input
                              type="file"
                              id="reply-file-upload"
                              className="hidden"
                              onChange={handleReplyFileUpload}
                              accept="image/*,.pdf,.doc,.docx"
                              disabled={uploadingReplyFile}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => document.getElementById('reply-file-upload')?.click()}
                              disabled={uploadingReplyFile}
                            >
                              {uploadingReplyFile ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Paperclip className="h-4 w-4 mr-1" />
                                  Attach File
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {showReplyEmojiPicker && (
                        <div className="flex flex-wrap gap-2 p-3 border border-white/10 rounded-lg glass shadow-xl">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setReplyToText(replyToText + emoji)}
                              className="text-2xl hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {showReplyMarkdownPreview ? (
                        <div className="prose prose-invert max-w-none p-4 border border-white/10 rounded-lg bg-white/5 min-h-[100px]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{replyToText || '*Preview will appear here*'}</ReactMarkdown>
                        </div>
                      ) : (
                        <Textarea
                          id="reply-to"
                          value={replyToText}
                          onChange={(e) => setReplyToText(e.target.value)}
                          placeholder="Write your reply... (Markdown supported)"
                          rows={3}
                          className="border-white/10 bg-white/5"
                        />
                      )}
                      
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={isSubmittingReply || !replyToText.trim()}>
                          {isSubmittingReply ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Reply
                            </>
                          )}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setShowReplyForm(false); setReplyingTo(null); setReplyToText(''); setShowReplyMarkdownPreview(false); setShowReplyEmojiPicker(false); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                </Card>
              )}

              {/* Nested Replies - Render from nested replies array */}
              {(() => {
                console.log(`Rendering nested replies for comment ${comment.id}:`, (comment as any).replies);
                return (comment as any).replies && (comment as any).replies.length > 0 && (
                  <>
                    {(comment as any).replies.map((reply: Comment) => (
                      <Card key={reply.id} className={`border border-white/5 bg-white/5 p-3 ml-8 ${reply.isAnswer ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                        <div className="flex items-start gap-2">
                          <img
                            src={reply.avatar}
                            alt={reply.author}
                            className="h-6 w-6 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{reply.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                              {reply.isAnswer && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-500">
                                  ✓ Answer
                                </span>
                              )}
                            </div>
                            {editingCommentId === reply.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={3}
                                  className="mb-2 text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleEditComment(reply.id)}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(null); setEditText(''); }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="prose prose-invert max-w-none text-xs mb-2">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.body}</ReactMarkdown>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>{reply.upvoteCount}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {emojis.slice(0, 3).map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleAddReaction(reply.id, emoji)}
                                        className="hover:scale-125 transition-transform"
                                        title={`React with ${emoji}`}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                  {hasGithubIdentity && isMaintainer && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 text-xs"
                                        onClick={() => { setEditingCommentId(reply.id); setEditText(reply.body); }}
                                      >
                                        <Edit2 className="h-2.5 w-2.5 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 text-xs text-red-500 hover:text-red-400"
                                        onClick={() => handleDeleteComment(reply.id)}
                                      >
                                        <Trash2 className="h-2.5 w-2.5 mr-1" />
                                        Delete
                                      </Button>
                                      {reply.isHidden ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 text-xs text-green-600 hover:text-green-500"
                                          onClick={() => handleUnhideComment(reply.id)}
                                        >
                                          <Eye className="h-2.5 w-2.5 mr-1" />
                                          Unhide
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 text-xs"
                                          onClick={() => handleHideComment(reply.id)}
                                        >
                                          <EyeOff className="h-2.5 w-2.5 mr-1" />
                                          Hide
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                );
              })()}
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
