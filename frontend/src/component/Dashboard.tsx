import React, { useEffect, useState, useCallback } from 'react'
import Layout from './Layout'
import type { Note } from '../types'
import { useAuth } from '../context/authContext'
import { api } from '../utils/api'

const Dashboard = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [creating, setCreating] = useState(false)

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [updating, setUpdating] = useState(false)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { user, token, logout } = useAuth()

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const response = (await api.getNotes()) as any
      console.log('Raw API response:', response)
      
      // Transform notes to ensure proper ID format
      const transformedNotes = (response.notes || []).map((note: any) => ({
        ...note,
        id: note.id || note._id // Use id if available, otherwise use _id
      }))
      
      console.log('Transformed notes:', transformedNotes)
      setNotes(transformedNotes)
    } catch (err) {
      console.error('Failed to fetch notes:', err)
      setError('Failed to fetch notes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newNote.title.trim() || !newNote.content.trim()) return

    try {
      setCreating(true)
      setError(null)
      
      const response = (await api.createNotes(newNote.title.trim(), newNote.content.trim())) as any
      
      // Optimistic update
      setNotes(prev => [response.note, ...prev])
      setNewNote({ title: '', content: '' })
      setShowCreateForm(false)
    } catch (err) {
      console.error('Failed to create note:', err)
      setError('Failed to create note. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!token) return

    try {
      setDeleting(id)
      setError(null)

      await api.deleteNotes(id)
      
      // Remove from UI after successful API call
      setNotes(prev => prev.filter(note => 
        note.id !== id && note._id !== id
      ))
      
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete note:', err)
      setError('Failed to delete note. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleEditClick = useCallback((note: Note) => {
    const noteId = note.id
    console.log('Editing note:', { noteId, note, editingNoteId })
    setEditingNoteId(noteId)
    setEditTitle(note.title)
    setEditContent(note.content)
    setError(null)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null)
    setEditTitle('')
    setEditContent('')
    setError(null)
  }, [])

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editingNoteId || !editTitle.trim() || !editContent.trim()) return

    try {
      setUpdating(true)
      setError(null)

      const response = (await api.updateNotes(
        editingNoteId,
        editTitle.trim(),
        editContent.trim()
      )) as any

      console.log('Update response:', response)

      // Update the note with server response, ensuring ID consistency
      const updatedNote = {
        ...response.note,
        id: response.note.id || response.note._id || editingNoteId
      }

      setNotes(prev => prev.map(n => 
        (n.id === editingNoteId || n._id === editingNoteId) ? updatedNote : n
      ))
      
      // Clear edit state
      setEditingNoteId(null)
      setEditTitle('')
      setEditContent('')
    } catch (err) {
      console.error('Failed to update note:', err)
      setError('Failed to update note. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const confirmDelete = (id: string) => {
    setDeleteConfirm(id)
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex justify-between flex-col sm:flex-row items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-blue-100 text-sm">{user?.email}</p>
              <div className="flex items-center mt-3 text-blue-100">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-sm">{notes.length} notes created</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-4 sm:mt-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 border border-white/20"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </span>
            </button>
          </div>
        </div>

        {/* Global Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Create Note Button */}
        <div className="mb-8">
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setError(null)
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <span className="flex items-center">
              {showCreateForm ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Note
                </>
              )}
            </span>
          </button>
        </div>

        {/* Create Note Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 transform transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Create New Note
              </h3>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-6">
              <input
                type="text"
                placeholder="Enter note title"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
                required
                maxLength={100}
              />

              <textarea
                placeholder="Write your note here..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-40 resize-none transition-all duration-200"
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
                required
                maxLength={1000}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl py-3 px-6 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg"
                  disabled={creating || !newNote.title.trim() || !newNote.content.trim()}
                >
                  {creating ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Note
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Your Notes
          </h2>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No notes yet!</h3>
            <p className="text-gray-500 mb-4">
              Create your first note to get started with organizing your thoughts
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Use the button above
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note, index) => (
              <div 
                key={note.id} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 relative transition-all duration-300 hover:scale-105 border border-gray-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Loading overlay for delete operations */}
                {deleting === note.id && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-200 border-t-red-600 mx-auto mb-2"></div>
                      <p className="text-red-600 font-medium">Deleting...</p>
                    </div>
                  </div>
                )}

                {editingNoteId === note.id ? (
                  // Edit Form
                  <form onSubmit={handleUpdateNote} className="space-y-4">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      maxLength={100}
                      autoFocus
                    />

                    <textarea
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-28 resize-none"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      required
                      maxLength={1000}
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-200 font-medium"
                        disabled={updating}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                        disabled={updating || !editTitle.trim() || !editContent.trim()}
                      >
                        {updating ? (
                          <span className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Updating...
                          </span>
                        ) : (
                          'Update'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  // Normal View
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-800 truncate pr-2 leading-tight">
                        {note.title}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditClick(note)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit note"
                          disabled={deleting === note.id}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(note.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete note"
                          disabled={deleting === note.id}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                      <div className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(note.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      {note.updatedAt && note.updatedAt !== note.createdAt && (
                        <div className="flex items-center text-blue-500">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Updated
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition-colors"
                  disabled={deleting === deleteConfirm}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteNote(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                  disabled={deleting === deleteConfirm}
                >
                  {deleting === deleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard