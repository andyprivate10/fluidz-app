import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../brand'
import { adminStyles } from '../../pages/AdminPage'
import { FolderOpen, ArrowLeft, Trash2, Image, HardDrive } from 'lucide-react'

const S = colors

type StorageFile = {
  name: string
  id: string | null
  created_at: string | null
  metadata: { size?: number } | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function AdminMediaTab() {
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchFolders = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.storage.from('avatars').list('', {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (!error && data) {
      // Folders show up as items with null metadata or id
      const folderNames = data
        .filter(f => f.id === null || (f.metadata && !f.metadata.mimetype))
        .map(f => f.name)
      // Also include items that look like UUIDs (user folders)
      const allNames = data.map(f => f.name)
      const uuidLike = allNames.filter(n => /^[0-9a-f-]{36}$/i.test(n))
      const combined = [...new Set([...folderNames, ...uuidLike])]
      setFolders(combined.length > 0 ? combined : allNames)
    }
    setLoading(false)
  }, [])

  const fetchFiles = useCallback(async (folder: string) => {
    setLoading(true)
    const { data, error } = await supabase.storage.from('avatars').list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (!error && data) {
      setFiles(data.filter(f => f.name !== '.emptyFolderPlaceholder') as StorageFile[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchFolders() }, [fetchFolders])

  useEffect(() => {
    if (selectedFolder) fetchFiles(selectedFolder)
  }, [selectedFolder, fetchFiles])

  const handleDelete = async (fileName: string) => {
    if (deleting !== fileName) { setDeleting(fileName); return }
    const path = selectedFolder + '/' + fileName
    await supabase.storage.from('avatars').remove([path])
    setDeleting(null)
    if (selectedFolder) fetchFiles(selectedFolder)
  }

  const getPublicUrl = (fileName: string): string => {
    const { data } = supabase.storage.from('avatars').getPublicUrl(
      selectedFolder + '/' + fileName
    )
    return data.publicUrl
  }

  const totalFiles = files.length
  const totalSize = files.reduce((sum, f) => sum + ((f.metadata as Record<string, unknown>)?.size as number || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={adminStyles.sectionLabel(S.violet)}>MEDIA BROWSER</p>

      {/* Breadcrumb / back */}
      {selectedFolder ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { setSelectedFolder(null); setFiles([]) }}
            style={{ ...adminStyles.btnSecondary, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
          >
            <ArrowLeft size={13} strokeWidth={1.5} /> Retour
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {selectedFolder}
          </span>
          <span style={{ fontSize: 10, color: S.tx3, marginLeft: 'auto' }}>
            {totalFiles} fichier{totalFiles !== 1 ? 's' : ''}
            {totalSize > 0 && (' | ' + formatBytes(totalSize))}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HardDrive size={14} strokeWidth={1.5} style={{ color: S.violet }} />
          <span style={{ fontSize: 12, color: S.tx2 }}>
            {folders.length} dossier{folders.length !== 1 ? 's' : ''} utilisateur
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: S.tx3, fontSize: 12 }}>Chargement...</div>
      ) : selectedFolder ? (
        /* File grid */
        files.length === 0 ? (
          <div style={{ ...adminStyles.card, textAlign: 'center', color: S.tx3, fontSize: 12 }}>
            Aucun fichier dans ce dossier.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {files.map(file => (
              <div key={file.name} style={{ ...adminStyles.card, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: S.bg2 }}>
                  <img
                    src={getPublicUrl(file.name)}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <div style={{ fontSize: 9, color: S.tx3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 9, color: S.tx3 }}>
                  {(file.metadata as Record<string, unknown>)?.size
                    ? formatBytes((file.metadata as Record<string, unknown>).size as number)
                    : ''}
                  {file.created_at && (' | ' + new Date(file.created_at).toLocaleDateString('fr-FR'))}
                </div>
                <button
                  onClick={() => handleDelete(file.name)}
                  style={{
                    ...adminStyles.btnDanger,
                    padding: '4px 6px',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                  }}
                >
                  <Trash2 size={10} strokeWidth={1.5} />
                  {deleting === file.name ? t('common.confirm') : t('common.delete')}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Folder list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {folders.map(folder => (
            <div key={folder} style={{ ...adminStyles.card, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FolderOpen size={16} strokeWidth={1.5} style={{ color: S.violet, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: S.tx, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {folder}
              </span>
              <button
                onClick={() => setSelectedFolder(folder)}
                style={{ ...adminStyles.btnSecondary, padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Image size={12} strokeWidth={1.5} /> Browse
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
