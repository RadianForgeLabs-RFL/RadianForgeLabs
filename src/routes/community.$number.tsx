import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, ExternalLink, Loader2, AlertCircle, Send, ThumbsUp, CheckCircle, Clock, User, Edit2, Eye, EyeOff, Smile, Paperclip, Upload, Trash2, Bell, BellOff } from "lucide-react";
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
  viewerFollowing?: boolean;
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
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  const [pollAllowAddOptions, setPollAllowAddOptions] = useState(false);
  const [polls, setPolls] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewCount, setViewCount] = useState(0);

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

  // Fetch polls for this discussion
  useEffect(() => {
    async function fetchPolls() {
      if (!discussion) return;

      try {
        const { data: pollsData, error: pollsError } = await supabase
          .from('polls')
          .select(`
            *,
            poll_options (*),
            poll_votes (user_id, option_id)
          `)
          .eq('discussion_id', discussion.id);

        if (pollsError) {
          console.error('Error fetching polls:', pollsError);
          return;
        }

        // Get user's votes
        if (user?.id) {
          const { data: userVotesData } = await supabase
            .from('poll_votes')
            .select('poll_id, option_id')
            .eq('user_id', user.id);

          const votesMap: Record<string, string> = {};
          userVotesData?.forEach((vote: any) => {
            votesMap[vote.poll_id] = vote.option_id;
          });

          setUserVotes(votesMap);
        }
        setPolls(pollsData || []);
      } catch (err) {
        console.error('Error fetching polls:', err);
      }
    }

    fetchPolls();
  }, [discussion, user]);

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
                    viewerFollowing
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
                viewerFollowing: repo.discussion.viewerFollowing || false,
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
        setIsFollowing(foundDiscussion.viewerFollowing || false);
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

      // Check if this is the main discussion or a comment
      if (commentId === discussion?.id) {
        setDiscussion({ ...discussion, upvoteCount: discussion.upvoteCount + 1 });
      } else {
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, upvoteCount: c.upvoteCount + 1 }
            : c
        ));
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

      // Update local state instead of reloading
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, body: editText }
          : c
      ));
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

      // Update local state instead of reloading
      setComments(comments.filter(c => c.id !== commentId));
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

      // Update local state to mark as hidden
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, isHidden: true }
          : c
      ));
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

      // Update local state to mark as visible
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, isHidden: false }
          : c
      ));
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

      // Update local state to mark as answer
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, isAnswer: true }
          : { ...c, isAnswer: false }
      ));
    } catch (err) {
      console.error('Error marking as answer:', err);
      alert('Failed to mark as answer');
    }
  };

  const handleUnmarkAsAnswer = async (commentId: string) => {
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

      // Update local state to unmark as answer
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, isAnswer: false }
          : c
      ));
    } catch (err) {
      console.error('Error unmarking as answer:', err);
      alert('Failed to unmark as answer');
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to create a poll');
      return;
    }

    if (!discussion) return;

    const validOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    try {
      // Create poll
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          discussion_id: discussion.id,
          question: pollQuestion,
          multiple_choice: pollMultipleChoice,
          allow_add_options: pollAllowAddOptions,
          created_by: user.id,
        })
        .select()
        .single();

      if (pollError) {
        console.error('Error creating poll:', pollError);
        alert('Failed to create poll');
        return;
      }

      // Create poll options
      const optionsToInsert = validOptions.map(option => ({
        poll_id: pollData.id,
        option_text: option,
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert);

      if (optionsError) {
        console.error('Error creating poll options:', optionsError);
        alert('Failed to create poll options');
        return;
      }

      // Reset form
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollMultipleChoice(false);
      setPollAllowAddOptions(false);
      setShowPollCreator(false);

      // Refresh polls
      const { data: refreshedPolls } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*)
        `)
        .eq('discussion_id', discussion.id);

      setPolls(refreshedPolls || []);
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Failed to create poll');
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      alert('You must be logged in to vote');
      return;
    }

    try {
      // Check if user already voted
      const existingVote = userVotes[pollId];
      
      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('poll_votes')
          .update({ option_id: optionId })
          .eq('poll_id', pollId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating vote:', error);
          alert('Failed to update vote');
          return;
        }

        // Update vote counts
        await supabase.rpc('decrement_vote_count', { option_id: existingVote });
        await supabase.rpc('increment_vote_count', { option_id: optionId });
      } else {
        // Create new vote
        const { error } = await supabase
          .from('poll_votes')
          .insert({
            poll_id: pollId,
            option_id: optionId,
            user_id: user.id,
          });

        if (error) {
          console.error('Error casting vote:', error);
          alert('Failed to cast vote');
          return;
        }

        // Increment vote count
        await supabase.rpc('increment_vote_count', { option_id: optionId });
      }

      // Update local state
      setUserVotes({ ...userVotes, [pollId]: optionId });

      // Refresh polls
      if (discussion?.id) {
        const { data: refreshedPolls } = await supabase
          .from('polls')
          .select(`
            *,
            poll_options (*)
          `)
          .eq('discussion_id', discussion.id);

        setPolls(refreshedPolls || []);
      }
    } catch (err) {
      console.error('Error voting:', err);
      alert('Failed to vote');
    }
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleFollowDiscussion = async () => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!discussion) return;

    try {
      const mutation = `
        mutation($discussionId: ID!) {
          ${isFollowing ? 'unfollowDiscussion' : 'followDiscussion'}(input: {discussionId: $discussionId}) {
            discussion {
              id
              viewerFollowing
            }
          }
        }
      `;

      const response = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mutation,
          variables: { discussionId: discussion.id },
        }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Failed to update follow status');
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
            </div>
          </div>
        </div>
        
        <div className="prose prose-invert max-w-none mb-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{discussion.body}</ReactMarkdown>
        </div>

        {/* Polls Section */}
        {polls.length > 0 && (
          <div className="space-y-4 mb-4">
            {polls.map((poll) => {
              const totalVotes = poll.poll_options?.reduce((sum: number, opt: any) => sum + opt.vote_count, 0) || 0;
              const userVote = userVotes[poll.id];

              return (
                <Card key={poll.id} className="border border-white/10 bg-white/5 p-4">
                  <h3 className="font-semibold mb-3">{poll.question}</h3>
                  <div className="space-y-2">
                    {poll.poll_options?.map((option: any) => {
                      const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
                      const isVoted = userVote === option.id;

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVote(poll.id, option.id)}
                          disabled={!user || poll.closed}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isVoted
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">{option.option_text}</span>
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${isVoted ? 'bg-purple-500' : 'bg-blue-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {option.vote_count} votes
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                    <span>{totalVotes} total votes</span>
                    {poll.closed && <span className="text-red-400">Closed</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Poll Button */}
        {user && (
          <div className="mb-4">
            {!showPollCreator ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPollCreator(true)}
                className="border-white/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
            ) : (
              <Card className="border border-white/10 bg-white/5 p-4">
                <form onSubmit={handleCreatePoll}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pollQuestion">Poll Question</Label>
                      <Input
                        id="pollQuestion"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="What would you like to ask?"
                        required
                        className="border-white/10 bg-white/5"
                      />
                    </div>
                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2 mt-2">
                        {pollOptions.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => handlePollOptionChange(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              required
                              className="border-white/10 bg-white/5 flex-1"
                            />
                            {pollOptions.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePollOption(index)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddPollOption}
                          className="border-white/10"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={pollMultipleChoice}
                          onChange={(e) => setPollMultipleChoice(e.target.checked)}
                          className="rounded"
                        />
                        Allow multiple choices
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={pollAllowAddOptions}
                          onChange={(e) => setPollAllowAddOptions(e.target.checked)}
                          className="rounded"
                        />
                        Allow users to add options
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Create Poll</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPollCreator(false);
                          setPollQuestion('');
                          setPollOptions(['', '']);
                          setPollMultipleChoice(false);
                          setPollAllowAddOptions(false);
                        }}
                        className="border-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            )}
          </div>
        )}

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
              onClick={() => setShowDiscussionEmojiPicker(!showDiscussionEmojiPicker)}
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

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
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
                          </div>
                        </>
                      )}
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
