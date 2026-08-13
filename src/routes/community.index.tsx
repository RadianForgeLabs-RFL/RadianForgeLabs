import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ExternalLink, Loader2, AlertCircle, Users, Clock, CheckCircle, X, Plus, Github, Eye, Smile, RefreshCw, ThumbsUp, Lock, Unlock, Pin, Trash2, Edit2, Archive, ArchiveRestore } from "lucide-react";
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
  body?: string;
  closed?: boolean;
  locked?: boolean;
  pinned?: boolean;
  updatedAt?: string;
  authorAvatar?: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_active'>('newest');
  const [showEditDiscussion, setShowEditDiscussion] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
  const [editDiscussion, setEditDiscussion] = useState({ title: '', body: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isMaintainer, setIsMaintainer] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

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

  // Fetch discussion templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const { data: templatesData } = await (supabase as any)
          .from('discussion_templates')
          .select('*')
          .eq('is_active', true);

        setTemplates(templatesData || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
      }
    }

    fetchTemplates();
  }, []);

  useEffect(() => {
    async function fetchDiscussions() {
      try {
        // Using GitHub GraphQL API to fetch organization discussions and categories
        const query = `
          query {
            organization(login: "RadianForgeLabs") {
              repositories(first: 10) {
                nodes {
                  discussions(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
                    nodes {
                      id
                      number
                      title
                      body
                      createdAt
                      updatedAt
                      closedAt
                      locked
                      author {
                        login
                        avatarUrl
                      }
                      answerChosenAt
                      answer {
                        id
                      }
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
                        description
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
          const errorText = await response.text();
          console.error('GitHub API error response:', errorText);
          throw new Error(`GitHub GraphQL API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.errors) {
          console.error('GraphQL errors:', data.errors);
          throw new Error(`GraphQL error: ${data.errors[0].message}`);
        }
        
        // Extract discussions and categories from all repositories
        let allDiscussions: Discussion[] = [];
        const categoryMap = new Map<string, { id: string; name: string; emoji: string; description: string }>();
        
        // Fetch pinned discussions from Supabase
        const { data: pinnedDiscussions, error: pinnedError } = await supabase
          .from('pinned_discussions')
          .select('discussion_id')
          .eq('organization', 'RadianForgeLabs');
        
        const pinnedIds = new Set(pinnedDiscussions?.map((p: any) => p.discussion_id) || []);
        
        if (data.data?.organization?.repositories?.nodes) {
          data.data.organization.repositories.nodes.forEach((repo: any) => {
            if (repo.discussions?.nodes) {
              repo.discussions.nodes.forEach((d: any) => {
                // Add to discussions
                allDiscussions.push({
                  id: d.id,
                  number: d.number,
                  title: d.title,
                  body: d.body,
                  author: d.author?.login || 'Unknown',
                  authorAvatar: d.author?.avatarUrl || '',
                  createdAt: d.createdAt,
                  updatedAt: d.updatedAt,
                  isAnswered: d.answerChosenAt !== null,
                  upvoteCount: d.reactions?.totalCount || 0,
                  commentCount: d.comments?.totalCount || 0,
                  categoryName: d.category?.name || 'General',
                  categoryId: d.category?.id || '',
                  closed: d.closedAt !== null,
                  locked: d.locked || false,
                  pinned: pinnedIds.has(d.id) // Check if discussion is pinned
                });
                
                // Add to categories if not exists
                if (d.category && !categoryMap.has(d.category.id)) {
                  let displayEmoji = d.category.emoji || '💬';
                  
                  // GitHub returns emoji shortcodes like :video_game:, convert to actual emoji
                  // Emoji mapping for GitHub category shortcodes
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
                    ':bar_chart:': '📊',
                    ':test_tube:': '🧪',
                    ':wrench:': '🔧',
                    ':hammer_and_wrench:': '🛠️',
                    ':hammer:': '🔨',
                    ':construction:': '🚧',
                    ':globe:': '🌍',
                    ':computer:': '💻',
                    ':game_die:': '🎲',
                    ':musical_note:': '🎵',
                    ':film:': '🎬',
                    ':pencil2:': '✏️',
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
                    ':desktop_computer:': '🖥️',
                    ':keyboard:': '⌨️',
                    ':mouse:': '🖱️',
                    ':cd:': '💿',
                    ':dvd:': '📀',
                    ':floppy_disk:': '💾',
                    ':camera:': '📷',
                    ':video_camera:': '📹',
                    ':tv:': '📺',
                    ':radio:': '📻',
                    ':pager:': '📟',
                    ':telephone:': '☎️',
                    ':mobile_phone:': '📱',
                    ':robot:': '🤖',
                    ':alien:': '👽',
                    ':ghost:': '👻',
                    ':skull:': '💀',
                    ':poop:': '💩',
                    ':smiley:': '😃',
                    ':smile:': '😄',
                    ':grin:': '😁',
                    ':laughing:': '😆',
                    ':wink:': '😉',
                    ':blush:': '😊',
                    ':yum:': '😋',
                    ':relieved:': '😌',
                    ':heart_eyes:': '😍',
                    ':sunglasses:': '😎',
                    ':stuck_out_tongue:': '😛',
                    ':stuck_out_tongue_winking_eye:': '😜',
                    ':stuck_out_tongue_closed_eyes:': '😝',
                    ':disappointed:': '😞',
                    ':worried:': '😟',
                    ':angry:': '😠',
                    ':rage:': '😡',
                    ':cry:': '😢',
                    ':persevere:': '😣',
                    ':triumph:': '😤',
                    ':disappointed_relieved:': '😥',
                    ':frowning:': '😦',
                    ':anguished:': '😧',
                    ':fearful:': '😨',
                    ':weary:': '😩',
                    ':sleepy:': '😪',
                    ':tired_face:': '😫',
                    ':grimacing:': '😬',
                    ':sob:': '😭',
                    ':open_mouth:': '😮',
                    ':hushed:': '😯',
                    ':astonished:': '😲',
                    ':dizzy_face:': '😵',
                    ':flushed:': '😳',
                    ':scream:': '😱',
                    ':neckbeard:': '🧔',
                    ':kiss:': '💋',
                    ':couple_with_heart:': '💑',
                    ':family:': '👪',
                    ':walking:': '🚶',
                    ':runner:': '🏃',
                    ':dancer:': '💃',
                    ':levitate:': '🕴️',
                    ':bicyclist:': '🚴',
                    ':mountain_bicyclist:': '🚵',
                    ':arrows_counterclockwise:': '🔄',
                    ':arrow_forward:': '▶️',
                    ':arrow_backward:': '◀️',
                    ':arrow_up_small:': '🔼',
                    ':arrow_down_small:': '🔽',
                    ':arrow_up:': '⬆️',
                    ':arrow_down:': '⬇️',
                    ':arrow_left:': '⬅️',
                    ':arrow_right:': '➡️',
                    ':arrow_upper_left:': '↖️',
                    ':arrow_upper_right:': '↗️',
                    ':arrow_lower_right:': '↘️',
                    ':arrow_lower_left:': '↙️',
                    ':arrow_up_down:': '↕️',
                    ':arrow_left_right:': '↔️',
                    ':arrows_clockwise:': '🔃',
                    ':rewind:': '⏪',
                    ':fast_forward:': '⏩',
                    ':twisted_rightwards_arrows:': '🔀',
                    ':repeat:': '🔁',
                    ':repeat_one:': '🔂',
                    ':ok_hand:': '👌',
                    ':thumbsup:': '👍',
                    ':thumbsdown:': '👎',
                    ':punch:': '👊',
                    ':fist:': '✊',
                    ':v:': '✌️',
                    ':wave:': '👋',
                    ':raised_hand:': '✋',
                    ':hand:': '🤚',
                    ':open_hands:': '👐',
                    ':point_up:': '☝️',
                    ':point_down:': '👇',
                    ':point_left:': '👈',
                    ':point_right:': '👉',
                    ':raised_hands:': '🙌',
                    ':pray:': '🙏',
                    ':clap:': '👏',
                    ':writing_hand:': '✍️',
                    ':nail_care:': '💅',
                    ':lips:': '👄',
                    ':tongue:': '👅',
                    ':ear:': '👂',
                    ':nose:': '👃',
                    ':eye:': '👁️',
                    ':eyes:': '👀',
                    ':bust_in_silhouette:': '👤',
                    ':busts_in_silhouette:': '👥',
                    ':speaking_head:': '🗣️',
                    ':baby:': '👶',
                    ':boy:': '👦',
                    ':girl:': '👧',
                    ':man:': '👨',
                    ':woman:': '👩',
                    ':person_with_blond_hair:': '👱',
                    ':older_man:': '👴',
                    ':older_woman:': '👵',
                    ':man_with_gua_pi_mao:': '👲',
                    ':man_with_turban:': '👳',
                    ':cop:': '👮',
                    ':construction_worker:': '👷',
                    ':princess:': '👸',
                    ':angel:': '👼',
                    ':santa:': '🎅',
                    ':japanese_ogre:': '👹',
                    ':japanese_goblin:': '👺',
                    ':space_invader:': '👾',
                    ':imp:': '👿',
                    ':smiley_cat:': '😺',
                    ':smile_cat:': '😸',
                    ':joy_cat:': '😹',
                    ':heart_eyes_cat:': '😻',
                    ':smirk_cat:': '😼',
                    ':kissing_cat:': '😽',
                    ':pouting_cat:': '😾',
                    ':crying_cat_face:': '😿',
                    ':scream_cat:': '🙀',
                    ':dog:': '🐶',
                    ':hamster:': '🐹',
                    ':rabbit:': '🐰',
                    ':wolf:': '🐺',
                    ':bear:': '🐻',
                    ':panda_face:': '🐼',
                    ':pig_nose:': '🐽',
                    ':pig:': '🐷',
                    ':frog:': '🐸',
                    ':koala:': '🐨',
                    ':monkey_face:': '🐵',
                    ':see_no_evil:': '🙈',
                    ':hear_no_evil:': '🙉',
                    ':speak_no_evil:': '🙊',
                    ':monkey:': '🐒',
                    ':chicken:': '🐔',
                    ':penguin:': '🐧',
                    ':bird:': '🐦',
                    ':baby_chick:': '🐤',
                    ':hatching_chick:': '🐥',
                    ':hatched_chick:': '🐣',
                    ':boar:': '🐗',
                    ':elephant:': '🐘',
                    ':octopus:': '🐙',
                    ':shell:': '🐚',
                    ':ant:': '🐜',
                    ':bee:': '🐝',
                    ':beetle:': '🐞',
                    ':snail:': '🐌',
                    ':butterfly:': '🦋',
                    ':turtle:': '🐢',
                    ':snake:': '🐍',
                    ':lizard:': '🦎',
                    ':racehorse:': '🐎',
                    ':ram:': '🐏',
                    ':sheep:': '🐑',
                    ':goat:': '🐐',
                    ':rooster:': '🐓',
                    ':kissing_heart:': '💏',
                    ':information_source:': 'ℹ️',
                    ':abc:': '🔤',
                    ':abcd:': '🔡',
                    ':capital_abcd:': '🔠',
                    ':symbols:': '🔣',
                    ':1234:': '🔢',
                    ':hash:': '#️⃣',
                    ':asterisk:': '*️⃣',
                    ':zero:': '0️⃣',
                    ':one:': '1️⃣',
                    ':two:': '2️⃣',
                    ':three:': '3️⃣',
                    ':four:': '4️⃣',
                    ':five:': '5️⃣',
                    ':six:': '6️⃣',
                    ':seven:': '7️⃣',
                    ':eight:': '8️⃣',
                    ':nine:': '9️⃣',
                    ':keycap_ten:': '🔟',
                  };
                  
                  if (displayEmoji.startsWith(':') && displayEmoji.endsWith(':')) {
                    displayEmoji = emojiMap[displayEmoji] || displayEmoji;
                  }
                  
                  // Fallback emoji based on category name if emoji is still generic or shortcode not found
                  if (displayEmoji.startsWith(':') || displayEmoji === '💬') {
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
                      displayEmoji = '�';
                    } else if (categoryName.includes('discussion') || categoryName.includes('talk')) {
                      displayEmoji = '�';
                    } else if (categoryName.includes('feedback')) {
                      displayEmoji = '💡';
                    } else if (categoryName.includes('question') || categoryName.includes('q&a')) {
                      displayEmoji = '❓';
                    } else if (categoryName.includes('tutorial') || categoryName.includes('guide')) {
                      displayEmoji = '📚';
                    }
                  }
                  
                  categoryMap.set(d.category.id, {
                    id: d.category.id,
                    name: d.category.name,
                    emoji: displayEmoji,
                    description: d.category.description || `${d.category.name} discussions`
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to load discussions';
        setError(errorMessage);
        
        // Show helpful error message if it's a token issue
        if (errorMessage.includes('GitHub token not configured') || errorMessage.includes('GitHub API error: 401') || errorMessage.includes('GitHub API error: 403')) {
          setError('GitHub API authentication failed. Please contact the administrator to configure the GitHub token.');
        }
        
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles([...attachedFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has GitHub identity linked
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Upload files to Supabase storage if any
      let fileUrls: string[] = [];
      if (attachedFiles.length > 0) {
        setUploadingFiles(true);
        for (const file of attachedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `discussion-attachments/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);
          
          fileUrls.push(publicUrl);
        }
        setUploadingFiles(false);
      }

      // Append file URLs to discussion body
      let bodyContent = newDiscussion.body;
      if (fileUrls.length > 0) {
        bodyContent += '\n\n**Attachments:**\n';
        fileUrls.forEach((url, index) => {
          bodyContent += `[${attachedFiles[index].name}](${url})\n`;
        });
      }

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

      const response = await fetch('/api/github-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            repositoryId: repoId,
            categoryId: newDiscussion.categoryId,
            title: newDiscussion.title,
            body: bodyContent,
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
      setAttachedFiles([]);
      
      // Reload the page to show new discussion
      window.location.reload();
    } catch (err) {
      console.error('Error creating discussion:', err);
      alert('Failed to create discussion. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
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
    setCurrentPage(1); // Reset to first page when filtering
    applyFilters(categoryId, searchQuery, sortBy);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
    applyFilters(selectedCategory, query, sortBy);
  };

  const handleSort = (sort: 'newest' | 'oldest' | 'most_active') => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page when sorting
    applyFilters(selectedCategory, searchQuery, sort);
  };

  const applyFilters = (category: string | null, search: string, sort: 'newest' | 'oldest' | 'most_active') => {
    let filtered = allDiscussions;

    // Apply category filter
    if (category !== null) {
      filtered = filtered.filter(d => d.categoryId === category);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(searchLower) ||
        (d.body && d.body.toLowerCase().includes(searchLower)) ||
        d.author.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting (pinned discussions always come first)
    filtered.sort((a, b) => {
      // Pinned discussions come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Then apply the selected sort
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_active':
          return b.commentCount - a.commentCount;
        default:
          return 0;
      }
    });

    setDiscussions(filtered);
  };

  // Get paginated discussions
  const paginatedDiscussions = discussions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(discussions.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseDiscussion = async (discussionId: string, close: boolean) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can close or reopen discussions.');
      return;
    }

    try {
      const mutation = close
        ? `
          mutation($discussionId: ID!) {
            closeDiscussion(input: {discussionId: $discussionId}) {
              discussion {
                id
                closedAt
              }
            }
          }
        `
        : `
          mutation($discussionId: ID!) {
            reopenDiscussion(input: {discussionId: $discussionId}) {
              discussion {
                id
                closedAt
              }
            }
          }
        `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mutation,
          variables: { discussionId }
        }),
      });

      // Update local state
      setDiscussions(discussions.map(d =>
        d.id === discussionId ? { ...d, closed: close } : d
      ));
    } catch (err) {
      console.error('Error toggling discussion status:', err);
      alert('Failed to update discussion status');
    }
  };

  const handleLockDiscussion = async (discussionId: string, lock: boolean) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can lock or unlock discussions.');
      return;
    }

    try {
      const mutation = lock
        ? `
          mutation($discussionId: ID!) {
            lockDiscussion(input: {discussionId: $discussionId}) {
              discussion {
                id
                locked
              }
            }
          }
        `
        : `
          mutation($discussionId: ID!) {
            unlockDiscussion(input: {discussionId: $discussionId}) {
              discussion {
                id
                locked
              }
            }
          }
        `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mutation,
          variables: { discussionId }
        }),
      });

      // Update local state
      setDiscussions(discussions.map(d =>
        d.id === discussionId ? { ...d, locked: lock } : d
      ));
    } catch (err) {
      console.error('Error toggling discussion lock:', err);
      alert('Failed to update discussion lock status');
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can delete discussions.');
      return;
    }

    if (!confirm('Are you sure you want to delete this discussion? This cannot be undone.')) return;

    try {
      const mutation = `
        mutation($discussionId: ID!) {
          deleteDiscussion(input: {discussionId: $discussionId}) {
            discussion {
              id
            }
          }
        }
      `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mutation,
          variables: { discussionId }
        }),
      });

      // Remove from local state
      setDiscussions(discussions.filter(d => d.id !== discussionId));
      setAllDiscussions(allDiscussions.filter(d => d.id !== discussionId));
    } catch (err) {
      console.error('Error deleting discussion:', err);
      alert('Failed to delete discussion');
    }
  };

  const handleEditDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }
    
    if (!editingDiscussion) return;

    setIsSubmitting(true);

    try {
      const mutation = `
        mutation($discussionId: ID!, $title: String!, $body: String!) {
          updateDiscussion(input: {discussionId: $discussionId, title: $title, body: $body}) {
            discussion {
              id
              title
              body
            }
          }
        }
      `;

      await fetch('/api/github-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mutation,
          variables: {
            discussionId: editingDiscussion.id,
            title: editDiscussion.title,
            body: editDiscussion.body,
          },
        }),
      });

      // Update local state
      setDiscussions(discussions.map(d =>
        d.id === editingDiscussion.id
          ? { ...d, title: editDiscussion.title, body: editDiscussion.body }
          : d
      ));
      setAllDiscussions(allDiscussions.map(d =>
        d.id === editingDiscussion.id
          ? { ...d, title: editDiscussion.title, body: editDiscussion.body }
          : d
      ));

      setShowEditDiscussion(false);
      setEditingDiscussion(null);
      setEditDiscussion({ title: '', body: '' });
    } catch (err) {
      console.error('Error editing discussion:', err);
      alert('Failed to edit discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinDiscussion = async (discussionId: string, pin: boolean) => {
    if (!hasGithubIdentity) {
      setShowLinkGithub(true);
      return;
    }

    if (!isMaintainer) {
      alert('Only maintainers can pin or unpin discussions.');
      return;
    }

    try {
      if (pin) {
        // Use upsert to handle duplicate key errors
        const { error } = await (supabase as any)
          .from('pinned_discussions')
          .upsert({
            discussion_id: discussionId,
            organization: 'RadianForgeLabs',
            pinned_by: user?.id,
          }, {
            onConflict: 'discussion_id,organization'
          });
        
        if (error) {
          console.error('Error pinning discussion:', error);
          alert('Failed to pin discussion');
          return;
        }
      } else {
        // Remove from database
        const { error } = await supabase
          .from('pinned_discussions')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('organization', 'RadianForgeLabs');
        
        if (error) {
          console.error('Error unpinning discussion:', error);
          alert('Failed to unpin discussion');
          return;
        }
      }

      // Update local state
      setDiscussions(discussions.map(d =>
        d.id === discussionId ? { ...d, pinned: pin } : d
      ));
      setAllDiscussions(allDiscussions.map(d =>
        d.id === discussionId ? { ...d, pinned: pin } : d
      ));
    } catch (err) {
      console.error('Error toggling pin:', err);
      alert('Failed to update pin status');
    }
  };

  const openEditDialog = (discussion: Discussion) => {
    setEditingDiscussion(discussion);
    setEditDiscussion({ title: discussion.title, body: discussion.body || '' });
    setShowEditDiscussion(true);
  };

  const handleMention = (username: string) => {
    setNewDiscussion({ ...newDiscussion, body: newDiscussion.body + `@${username} ` });
    setShowMentionDropdown(false);
    setMentionQuery('');
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNewDiscussion({
        title: template.title_template,
        body: template.body_template,
        categoryId: template.category_id || '',
      });
      setSelectedTemplate(templateId);
    }
  };

  const handleBodyChange = (value: string) => {
    setNewDiscussion({ ...newDiscussion, body: value });
    
    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      const nextSpaceIndex = textAfterAt.indexOf(' ');
      const mentionText = nextSpaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, nextSpaceIndex);
      
      if (mentionText.length > 0 && (nextSpaceIndex === -1 || nextSpaceIndex === value.length - lastAtIndex - 1)) {
        setMentionQuery(mentionText);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Extract unique usernames from discussions for mention suggestions
  const mentionedUsers = Array.from(new Set(allDiscussions.map(d => d.author))).filter(Boolean);

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
                
                // GitHub returns emoji shortcodes like :video_game:, convert to actual emoji
                // Extended emoji mapping for more categories - matching GitHub's emoji shortcodes
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
                  ':desktop_computer:': '🖥️',
                  ':keyboard:': '⌨️',
                  ':mouse:': '🖱️',
                  ':cd:': '💿',
                  ':dvd:': '📀',
                  ':floppy_disk:': '💾',
                  ':camera:': '📷',
                  ':video_camera:': '📹',
                  ':tv:': '📺',
                  ':radio:': '📻',
                  ':pager:': '📟',
                  ':telephone:': '☎️',
                  ':mobile_phone:': '📱',
                  ':robot:': '🤖',
                  ':alien:': '👽',
                  ':ghost:': '👻',
                  ':skull:': '💀',
                  ':poop:': '💩',
                  ':smiley:': '😃',
                  ':smile:': '😄',
                  ':grin:': '😁',
                  ':laughing:': '😆',
                  ':wink:': '😉',
                  ':blush:': '😊',
                  ':yum:': '😋',
                  ':relieved:': '😌',
                  ':heart_eyes:': '😍',
                  ':sunglasses:': '😎',
                  ':stuck_out_tongue:': '😛',
                  ':stuck_out_tongue_winking_eye:': '😜',
                  ':stuck_out_tongue_closed_eyes:': '😝',
                  ':disappointed:': '😞',
                  ':worried:': '😟',
                  ':angry:': '😠',
                  ':rage:': '😡',
                  ':cry:': '😢',
                  ':persevere:': '😣',
                  ':triumph:': '😤',
                  ':disappointed_relieved:': '😥',
                  ':frowning:': '😦',
                  ':anguished:': '😧',
                  ':fearful:': '😨',
                  ':weary:': '😩',
                  ':sleepy:': '😪',
                  ':tired_face:': '😫',
                  ':grimacing:': '😬',
                  ':sob:': '😭',
                  ':open_mouth:': '😮',
                  ':hushed:': '😯',
                  ':astonished:': '😲',
                  ':dizzy_face:': '😵',
                  ':flushed:': '😳',
                  ':scream:': '😱',
                  ':neckbeard:': '🧔',
                  ':kiss:': '💋',
                  ':couple_with_heart:': '💑',
                  ':family:': '👪',
                  ':walking:': '🚶',
                  ':runner:': '🏃',
                  ':dancer:': '💃',
                  ':levitate:': '🕴️',
                  ':bicyclist:': '🚴',
                  ':mountain_bicyclist:': '🚵',
                  ':arrows_counterclockwise:': '🔄',
                  ':arrow_forward:': '▶️',
                  ':arrow_backward:': '◀️',
                  ':arrow_up_small:': '🔼',
                  ':arrow_down_small:': '🔽',
                  ':arrow_up:': '⬆️',
                  ':arrow_down:': '⬇️',
                  ':arrow_left:': '⬅️',
                  ':arrow_right:': '➡️',
                  ':arrow_upper_left:': '↖️',
                  ':arrow_upper_right:': '↗️',
                  ':arrow_lower_right:': '↘️',
                  ':arrow_lower_left:': '↙️',
                  ':arrow_up_down:': '↕️',
                  ':arrow_left_right:': '↔️',
                  ':arrows_clockwise:': '🔃',
                  ':rewind:': '⏪',
                  ':fast_forward:': '⏩',
                  ':twisted_rightwards_arrows:': '🔀',
                  ':repeat:': '🔁',
                  ':repeat_one:': '🔂',
                  ':ok_hand:': '👌',
                  ':thumbsup:': '👍',
                  ':thumbsdown:': '👎',
                  ':punch:': '👊',
                  ':fist:': '✊',
                  ':v:': '✌️',
                  ':wave:': '👋',
                  ':raised_hand:': '✋',
                  ':hand:': '🤚',
                  ':open_hands:': '👐',
                  ':point_up:': '☝️',
                  ':point_down:': '👇',
                  ':point_left:': '👈',
                  ':point_right:': '👉',
                  ':raised_hands:': '🙌',
                  ':pray:': '🙏',
                  ':clap:': '👏',
                  ':writing_hand:': '✍️',
                  ':nail_care:': '💅',
                  ':lips:': '👄',
                  ':tongue:': '👅',
                  ':ear:': '👂',
                  ':nose:': '👃',
                  ':eye:': '👁️',
                  ':eyes:': '👀',
                  ':bust_in_silhouette:': '👤',
                  ':busts_in_silhouette:': '👥',
                  ':speaking_head:': '🗣️',
                  ':baby:': '👶',
                  ':boy:': '👦',
                  ':girl:': '👧',
                  ':man:': '👨',
                  ':woman:': '👩',
                  ':older_man:': '👴',
                  ':older_woman:': '👵',
                  ':man_with_gua_pi_mao:': '👲',
                  ':man_with_turban:': '👳',
                  ':cop:': '👮',
                  ':construction_worker:': '👷',
                  ':princess:': '👸',
                  ':angel:': '👼',
                  ':santa:': '🎅',
                  ':japanese_ogre:': '👹',
                  ':japanese_goblin:': '👺',
                  ':space_invader:': '👾',
                  ':imp:': '👿',
                  ':smiley_cat:': '😺',
                  ':smile_cat:': '😸',
                  ':joy_cat:': '😹',
                  ':heart_eyes_cat:': '😻',
                  ':smirk_cat:': '😼',
                  ':kissing_cat:': '😽',
                  ':pouting_cat:': '😾',
                  ':crying_cat_face:': '😿',
                  ':scream_cat:': '🙀',
                  ':dog:': '🐶',
                  ':hamster:': '🐹',
                  ':rabbit:': '🐰',
                  ':wolf:': '🐺',
                  ':bear:': '🐻',
                  ':panda_face:': '🐼',
                  ':pig_nose:': '🐽',
                  ':pig:': '🐷',
                  ':frog:': '🐸',
                  ':koala:': '🐨',
                  ':monkey_face:': '🐵',
                  ':see_no_evil:': '🙈',
                  ':hear_no_evil:': '🙉',
                  ':speak_no_evil:': '🙊',
                  ':monkey:': '🐒',
                  ':chicken:': '🐔',
                  ':penguin:': '🐧',
                  ':baby_chick:': '🐤',
                  ':hatching_chick:': '🐥',
                  ':hatched_chick:': '🐣',
                  ':boar:': '🐗',
                  ':elephant:': '🐘',
                  ':octopus:': '🐙',
                  ':shell:': '🐚',
                  ':ant:': '🐜',
                  ':bee:': '🐝',
                  ':beetle:': '🐞',
                  ':snail:': '🐌',
                  ':butterfly:': '🦋',
                  ':turtle:': '🐢',
                  ':snake:': '🐍',
                  ':lizard:': '🦎',
                  ':racehorse:': '🐎',
                  ':ram:': '🐏',
                  ':sheep:': '🐑',
                  ':goat:': '🐐',
                  ':rooster:': '🐓',
                  ':kissing_heart:': '💏',
                  ':information_source:': 'ℹ️',
                  ':abc:': '🔤',
                  ':abcd:': '🔡',
                  ':capital_abcd:': '🔠',
                  ':symbols:': '🔣',
                  ':1234:': '🔢',
                  ':hash:': '#️⃣',
                  ':asterisk:': '*️⃣',
                  ':zero:': '0️⃣',
                  ':one:': '1️⃣',
                  ':two:': '2️⃣',
                  ':three:': '3️⃣',
                  ':four:': '4️⃣',
                  ':five:': '5️⃣',
                  ':six:': '6️⃣',
                  ':seven:': '7️⃣',
                  ':eight:': '8️⃣',
                  ':nine:': '9️⃣',
                  ':keycap_ten:': '🔟',
                  };
                
                if (displayEmoji.startsWith(':') && displayEmoji.endsWith(':')) {
                  displayEmoji = emojiMap[displayEmoji] || displayEmoji;
                }
                
                // Fallback emoji based on category name if emoji is still generic or shortcode not found
                if (displayEmoji.startsWith(':') || displayEmoji === '💬') {
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
                  } else if (categoryName.includes('discussion') || categoryName.includes('talk')) {
                    displayEmoji = '💬';
                  } else if (categoryName.includes('feedback')) {
                    displayEmoji = '💡';
                  } else if (categoryName.includes('question') || categoryName.includes('q&a')) {
                    displayEmoji = '❓';
                  } else if (categoryName.includes('tutorial') || categoryName.includes('guide')) {
                    displayEmoji = '📚';
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
          <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            <div className="flex items-center gap-2">
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
          </div>

          {/* Search and Sort Bar */}
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="border-white/10 bg-white/5"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => handleSort(value)}>
              <SelectTrigger className="w-[180px] border-white/10 bg-white/5">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most_active">Most Active</SelectItem>
              </SelectContent>
            </Select>
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
                      className="border-white/10 bg-white/5"
                    />
                  </div>

                  {/* Template Selector */}
                  {templates.length > 0 && (
                    <div>
                      <Label htmlFor="template">Use Template</Label>
                      <select
                        id="template"
                        value={selectedTemplate || ''}
                        onChange={(e) => e.target.value ? handleApplyTemplate(e.target.value) : setSelectedTemplate(null)}
                        className="w-full p-2 rounded border border-white/10 bg-white/5 text-foreground"
                      >
                        <option value="">Select a template...</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                    <Label htmlFor="files">Attachments</Label>
                    <div className="space-y-2">
                      <Input
                        id="files"
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="border-white/10 bg-white/5"
                      />
                      {attachedFiles.length > 0 && (
                        <div className="space-y-2">
                          {attachedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10">
                              <span className="text-sm truncate">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {uploadingFiles && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading files...
                        </div>
                      )}
                    </div>
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
                      <div className="relative">
                        <Textarea
                          id="body"
                          value={newDiscussion.body}
                          onChange={(e) => handleBodyChange(e.target.value)}
                          placeholder="Describe your discussion in detail... (Markdown supported, use @ to mention users)"
                          rows={6}
                          required
                        />
                        {showMentionDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto border border-white/10 rounded-lg bg-white/5 glass shadow-xl z-10">
                            {mentionedUsers
                              .filter(user => user.toLowerCase().includes(mentionQuery.toLowerCase()))
                              .slice(0, 5)
                              .map((username) => (
                                <button
                                  key={username}
                                  type="button"
                                  onClick={() => handleMention(username)}
                                  className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>@{username}</span>
                                </button>
                              ))}
                            {mentionedUsers.filter(user => user.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
                              <div className="px-4 py-2 text-sm text-muted-foreground">No users found</div>
                            )}
                          </div>
                        )}
                      </div>
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

          {showEditDiscussion && editingDiscussion && (
            <Card className="border border-white/5 bg-white/5 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Discussion</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowEditDiscussion(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleEditDiscussion}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editDiscussion.title}
                      onChange={(e) => setEditDiscussion({ ...editDiscussion, title: e.target.value })}
                      placeholder="Discussion title"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="edit-body">Content</Label>
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
                      <div className="flex flex-wrap gap-2 p-3 border border-white/10 rounded-lg glass shadow-xl mb-3">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setEditDiscussion({ ...editDiscussion, body: editDiscussion.body + emoji })}
                            className="text-2xl hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {showMarkdownPreview ? (
                      <div className="prose prose-invert max-w-none p-4 border border-white/10 rounded-lg bg-white/5 min-h-[150px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{editDiscussion.body || '*Preview will appear here*'}</ReactMarkdown>
                      </div>
                    ) : (
                      <Textarea
                        id="edit-body"
                        value={editDiscussion.body}
                        onChange={(e) => setEditDiscussion({ ...editDiscussion, body: e.target.value })}
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
                    <Button type="button" variant="outline" onClick={() => setShowEditDiscussion(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Discussion'}
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
              {paginatedDiscussions.map((disc) => (
                <Card key={disc.id} className={`border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors ${disc.closed ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
                      {disc.authorAvatar ? (
                        <img src={disc.authorAvatar} alt={disc.author} className="h-10 w-10 rounded-full" />
                      ) : (
                        <MessageSquare className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {disc.pinned && <Pin className="h-4 w-4 text-purple-500" />}
                        {disc.categoryName && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{disc.categoryName}</span>
                        )}
                        {disc.isAnswered && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {disc.closed && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">Closed</span>}
                        {disc.locked && <Lock className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <a href={`/community/${disc.number}`} className="block">
                        <h3 className="font-semibold text-foreground mb-1 hover:text-purple-400 transition-colors">{disc.title}</h3>
                      </a>
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
                          {disc.commentCount} comments
                        </span>
                      </div>
                      {hasGithubIdentity && isMaintainer && (
                        <div className="flex items-center gap-2 mt-2">
                          {disc.pinned ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-purple-600 hover:text-purple-500"
                              onClick={() => handlePinDiscussion(disc.id, false)}
                            >
                              <Pin className="h-3 w-3 mr-1" />
                              Unpin
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-purple-600 hover:text-purple-500"
                              onClick={() => handlePinDiscussion(disc.id, true)}
                            >
                              <Pin className="h-3 w-3 mr-1" />
                              Pin
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => openEditDialog(disc)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {disc.closed ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-green-600 hover:text-green-500"
                              onClick={() => handleCloseDiscussion(disc.id, false)}
                            >
                              <ArchiveRestore className="h-3 w-3 mr-1" />
                              Reopen
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-red-600 hover:text-red-500"
                              onClick={() => handleCloseDiscussion(disc.id, true)}
                            >
                              <Archive className="h-3 w-3 mr-1" />
                              Close
                            </Button>
                          )}
                          {disc.locked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-green-600 hover:text-green-500"
                              onClick={() => handleLockDiscussion(disc.id, false)}
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Unlock
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-yellow-600 hover:text-yellow-500"
                              onClick={() => handleLockDiscussion(disc.id, true)}
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Lock
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-red-500 hover:text-red-400"
                            onClick={() => handleDeleteDiscussion(disc.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
