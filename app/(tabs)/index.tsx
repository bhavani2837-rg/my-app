import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';

/* ================= TYPES ================= */

type ViewType = 'categories' | 'posts' | 'detail';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
}

interface Author {
  name: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  categoryId: string;
  createdAt: number;
  likes: number;
  comments: number;
  views: number;
  isPinned: boolean;
  tags: string[];
}

interface Comment {
  id: string;
  author: Author;
  content: string;
  createdAt: number;
  likes: number;
}

/* ================= HELPERS ================= */

const timeAgo = (ts: number) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

/* ================= DATA ================= */

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'General Discussion', description: 'Talk about anything', icon: '💬', postCount: 1 },
  { id: '2', name: 'Help & Support', description: 'Get help here', icon: '🆘', postCount: 0 },
  { id: '3', name: 'Feature Requests', description: 'Share ideas', icon: '💡', postCount: 0 },
  { id: '4', name: 'Show & Tell', description: 'Show your work', icon: '🎨', postCount: 0 },
  { id: '5', name: 'News & Updates', description: 'Latest updates', icon: '📰', postCount: 0 },
  { id: '6', name: 'Community Events', description: 'Meetups & events', icon: '🎉', postCount: 0 },
];

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    title: 'Welcome to the forum!',
    content: 'Introduce yourself and start discussions.',
    author: { name: 'Admin' },
    categoryId: '1',
    createdAt: Date.now() - 7200000,
    likes: 10,
    comments: 2,
    views: 45,
    isPinned: true,
    tags: ['welcome'],
  },
];

/* ================= MAIN ================= */

export default function ForumApp() {
  const [view, setView] = useState<ViewType>('categories');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [search, setSearch] = useState('');

  /* ================= STORAGE ================= */

  useEffect(() => {
    AsyncStorage.getItem('forumData').then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setPosts(parsed.posts);
        setComments(parsed.comments);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      'forumData',
      JSON.stringify({ posts, comments })
    );
  }, [posts, comments]);

  /* ================= FILTER ================= */

  const filteredPosts = posts
    .filter(p => (selectedCategory ? p.categoryId === selectedCategory : true))
    .filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((tag: string) =>
        tag.toLowerCase().includes(search.toLowerCase())
      )
    )
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.header}>Discussion Forum</Text>

      {/* SEARCH */}
      <TextInput
        placeholder="Search..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* CATEGORIES */}
      {view === 'categories' && (
        <FlatList
          data={categories}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                setSelectedCategory(item.id);
                setView('posts');
                setSearch('');
              }}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.meta}>{item.postCount} posts</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* POSTS */}
      {view === 'posts' && (
        <>
          <TouchableOpacity onPress={() => setView('categories')}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>

          <FlatList
            data={filteredPosts}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedPost(item);
                  setView('detail');
                  setPosts(prev =>
                    prev.map(p =>
                      p.id === item.id ? { ...p, views: p.views + 1 } : p
                    )
                  );
                }}
              >
                {item.isPinned && <Text style={styles.pinned}>📌 PINNED</Text>}
                <Text style={styles.title}>{item.title}</Text>
                <Text numberOfLines={2}>{item.content}</Text>
                <Text style={styles.meta}>
                  {item.author.name} · {timeAgo(item.createdAt)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* POST DETAIL */}
      {view === 'detail' && selectedPost && (
        <ScrollView>
          <TouchableOpacity onPress={() => setView('posts')}>
            <Text style={styles.back}>← Back to Posts</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{selectedPost.title}</Text>
          <Text style={styles.meta}>
            {selectedPost.author.name} · {timeAgo(selectedPost.createdAt)}
          </Text>
          <Text style={styles.content}>{selectedPost.content}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  search: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  icon: { fontSize: 22 },
  title: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  desc: { color: '#6B7280', marginTop: 2 },
  meta: { color: '#6B7280', marginTop: 6, fontSize: 12 },
  pinned: { color: '#B45309', fontWeight: 'bold' },
  back: { color: '#2563EB', marginBottom: 10 },
  content: { marginTop: 12, fontSize: 15 },
});
