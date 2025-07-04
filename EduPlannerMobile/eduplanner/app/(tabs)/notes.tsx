import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  TextInput,
  Button,
  IconButton,
  Chip,
  Surface,
  ActivityIndicator,
  Snackbar,
  Modal,
  Portal,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
}

const NOTES_STORAGE_KEY = '@eduplanner_notes';
const CATEGORIES = ['General', 'Study', 'Ideas', 'Important', 'Personal'];
const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function NotesScreen() {
  const router = useRouter();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  const [noteTags, setNoteTags] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes);
        setNotes(parsedNotes.sort((a: Note, b: Note) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSnackbarMessage('Failed to save notes');
      setSnackbarVisible(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const resetForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('General');
    setNoteTags('');
    setEditingNote(null);
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      setSnackbarMessage('Please fill in both title and content');
      setSnackbarVisible(true);
      return;
    }

    const newNote: Note = {
      id: generateId(),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory,
      tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
    };

    const updatedNotes = [newNote, ...notes];
    await saveNotes(updatedNotes);
    
    setShowCreateModal(false);
    resetForm();
    setSnackbarMessage('Note created successfully');
    setSnackbarVisible(true);
  };

  const handleEditNote = async () => {
    if (!editingNote || !noteTitle.trim() || !noteContent.trim()) {
      setSnackbarMessage('Please fill in both title and content');
      setSnackbarVisible(true);
      return;
    }

    const updatedNote: Note = {
      ...editingNote,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory,
      tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = notes.map(note => 
      note.id === editingNote.id ? updatedNote : note
    );
    
    await saveNotes(updatedNotes);
    
    setShowCreateModal(false);
    resetForm();
    setSnackbarMessage('Note updated successfully');
    setSnackbarVisible(true);
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNotes = notes.filter(note => note.id !== noteId);
            await saveNotes(updatedNotes);
            setSnackbarMessage('Note deleted');
            setSnackbarVisible(true);
          },
        },
      ]
    );
  };

  const handlePinNote = async (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    );
    
    // Sort to move pinned notes to top
    updatedNotes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    await saveNotes(updatedNotes);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNoteTags(note.tags.join(', '));
    setShowCreateModal(true);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const index = CATEGORIES.indexOf(category);
    return COLORS[index] || COLORS[0];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>My Notes</Title>
          <IconButton
            icon="plus"
            size={24}
            iconColor="#6366f1"
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          />
        </View>
        
        {/* Search */}
        <TextInput
          label="Search notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
        />
        
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          <Chip
            selected={selectedCategory === 'All'}
            onPress={() => setSelectedCategory('All')}
            style={[styles.categoryChip, selectedCategory === 'All' && styles.selectedCategoryChip]}
          >
            All
          </Chip>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip,
                { backgroundColor: selectedCategory === category ? getCategoryColor(category) : '#f3f4f6' }
              ]}
              textStyle={selectedCategory === category ? { color: 'white' } : {}}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </Surface>

      {/* Notes List */}
      <ScrollView
        style={styles.notesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="note-add" size={48} color="#d1d5db" />
              <Title style={styles.emptyTitle}>
                {searchQuery || selectedCategory !== 'All' ? 'No matching notes' : 'No notes yet'}
              </Title>
              <Paragraph style={styles.emptyDescription}>
                {searchQuery || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter'
                  : 'Create your first note to get started!'
                }
              </Paragraph>
              {!searchQuery && selectedCategory === 'All' && (
                <Button
                  mode="contained"
                  onPress={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  style={styles.createButton}
                >
                  Create Note
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <TouchableOpacity
              key={note.id}
              onPress={() => openEditModal(note)}
              activeOpacity={0.7}
            >
              <Card style={[styles.noteCard, note.isPinned && styles.pinnedCard]}>
                <Card.Content>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteTitleContainer}>
                      <Title style={styles.noteTitle}>
                        {note.isPinned && '📌 '}{note.title}
                      </Title>
                      <Chip
                        style={[styles.categoryTag, { backgroundColor: getCategoryColor(note.category) }]}
                        textStyle={styles.categoryTagText}
                      >
                        {note.category}
                      </Chip>
                    </View>
                    <View style={styles.noteActions}>
                      <IconButton
                        icon={note.isPinned ? "pin" : "pin-outline"}
                        size={20}
                        iconColor={note.isPinned ? "#6366f1" : "#6b7280"}
                        onPress={() => handlePinNote(note.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#ef4444"
                        onPress={() => handleDeleteNote(note.id)}
                      />
                    </View>
                  </View>
                  
                  <Paragraph style={styles.noteContent} numberOfLines={3}>
                    {note.content}
                  </Paragraph>
                  
                  {note.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {note.tags.map((tag, index) => (
                        <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                          #{tag}
                        </Chip>
                      ))}
                    </View>
                  )}
                  
                  <Text style={styles.noteDate}>
                    {note.createdAt !== note.updatedAt ? 'Updated' : 'Created'} {' '}
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>
            {editingNote ? 'Edit Note' : 'Create New Note'}
          </Title>
          
          <TextInput
            label="Note Title"
            value={noteTitle}
            onChangeText={setNoteTitle}
            mode="outlined"
            style={styles.modalInput}
          />
          
          <TextInput
            label="Note Content"
            value={noteContent}
            onChangeText={setNoteContent}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.modalInput}
          />
          
          <Text style={styles.modalLabel}>Category</Text>
          <View style={styles.modalCategoryContainer}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                selected={noteCategory === category}
                onPress={() => setNoteCategory(category)}
                style={[
                  styles.modalCategoryChip,
                  noteCategory === category && { backgroundColor: getCategoryColor(category) }
                ]}
                textStyle={noteCategory === category ? { color: 'white' } : {}}
              >
                {category}
              </Chip>
            ))}
          </View>
          
          <TextInput
            label="Tags (comma separated)"
            value={noteTags}
            onChangeText={setNoteTags}
            mode="outlined"
            style={styles.modalInput}
            placeholder="study, important, review"
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              style={styles.modalCancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={editingNote ? handleEditNote : handleCreateNote}
              style={styles.modalSaveButton}
            >
              {editingNote ? 'Update' : 'Create'}
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    paddingBottom: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    color: '#6366f1',
    fontSize: 24,
  },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
  },
  categoryScroll: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedCategoryChip: {
    backgroundColor: '#6366f1',
  },
  notesList: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  pinnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitleContainer: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  categoryTag: {
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    color: 'white',
    fontSize: 12,
  },
  noteActions: {
    flexDirection: 'row',
  },
  noteContent: {
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#f3f4f6',
  },
  tagText: {
    fontSize: 12,
    color: '#6366f1',
  },
  noteDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#6366f1',
    marginBottom: 16,
    fontSize: 20,
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  modalCategoryChip: {
    margin: 4,
    backgroundColor: '#f3f4f6',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 8,
  },
  modalSaveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#6366f1',
  },
  snackbar: {
    backgroundColor: '#6366f1',
  },
});
