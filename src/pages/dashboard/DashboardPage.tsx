import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, RefreshCw, PlusCircle, Search, Filter, ChevronDown, Pencil, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale/id'
import { useAnimals } from '../../hooks/useAnimals'
import { useAnimalTypes } from '../../hooks/useAnimalTypes'
import { useProfile } from '../../hooks/useProfile'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { AnimalWithType } from '../../types'
import './Dashboard.css'

export default function DashboardPage() {
  const { profile } = useProfile()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [sortField, setSortField] = useState<'captured_at' | 'name'>('captured_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)

  const { animals, loading, getRandomAnimal, deleteAnimal } = useAnimals({
    searchQuery,
    typeId: selectedTypeId || undefined,
    sortField,
    sortOrder,
  })
  const { types } = useAnimalTypes()

  // Random animal spotlight
  const [randomAnimal, setRandomAnimal] = useState<AnimalWithType | null>(null)
  const [loadingRandom, setLoadingRandom] = useState(true)

  // Detail modal
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalWithType | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refreshRandom = async () => {
    setLoadingRandom(true)
    const animal = await getRandomAnimal()
    setRandomAnimal(animal)
    setLoadingRandom(false)
  }

  useEffect(() => {
    refreshRandom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (animalId: string) => {
    await deleteAnimal(animalId)
    setDeletingId(null)
    if (randomAnimal?.id === animalId) {
      refreshRandom()
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{greeting()}, {profile?.full_name ?? 'Teman'}! 👋</h1>
          <p className="subtitle">Kamu sudah mengoleksi <strong>{animals.length}</strong> kucing & anabul di StrayCat 🐾</p>
        </div>
        <Link to="/add">
          <Button icon={<PlusCircle size={18} />}>Tambah Kucing</Button>
        </Link>
      </div>

      {/* Random Animal Spotlight */}
      <div className="spotlight-card">
        <div className="spotlight-header">
          <h2>Sorotan Anabul Hari Ini</h2>
          <Button variant="ghost" size="sm" onClick={refreshRandom} icon={<RefreshCw size={16} />}>
            Acak Lagi
          </Button>
        </div>
        {loadingRandom ? (
          <LoadingSpinner size={24} />
        ) : randomAnimal ? (
          <div className="spotlight-content">
            <img src={randomAnimal.photo_url} alt={randomAnimal.name} className="spotlight-photo" />
            <div className="spotlight-info">
              <h3>{randomAnimal.name}</h3>
              <span className="animal-badge">
                {randomAnimal.animal_types?.icon} {randomAnimal.animal_types?.name}
              </span>
              {randomAnimal.location_name && (
                <p className="spotlight-location">
                  <MapPin size={14} /> {randomAnimal.location_name}
                </p>
              )}
              <p className="spotlight-date">
                <Calendar size={14} />{' '}
                {format(new Date(randomAnimal.captured_at), 'EEEE, dd MMMM yyyy • HH:mm', { locale: id })}
              </p>
              {randomAnimal.description && <p className="spotlight-desc">{randomAnimal.description}</p>}
            </div>
          </div>
        ) : (
          <div className="spotlight-empty">
            <p>Belum ada anabul yang dikoleksi. <Link to="/add">Tambah sekarang!</Link></p>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Input
            placeholder="Cari nama anabul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          icon={<Filter size={16} />}
        >
          Filter <ChevronDown size={14} />
        </Button>
      </div>

      {showFilters && (
        <div className="filter-options">
          <div className="filter-group">
            <label>Jenis:</label>
            <select value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)}>
              <option value="">Semua Jenis</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Urutkan:</label>
            <select value={sortField} onChange={(e) => setSortField(e.target.value as 'captured_at' | 'name')}>
              <option value="captured_at">Tanggal</option>
              <option value="name">Nama</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Urutan:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </select>
          </div>
        </div>
      )}

      {/* Animals Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : animals.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🐱</span>
          <h3>Belum Ada Kucing Terdata</h3>
          <p>Yuk mulai petualangan foto kucing liar yang kamu temui di sekitarmu!</p>
          <Link to="/add">
            <Button icon={<PlusCircle size={18} />}>Foto Kucing Pertama</Button>
          </Link>
        </div>
      ) : (
        <div className="animals-grid">
          {animals.map((animal) => (
            <div key={animal.id} className="animal-card">
              <div className="card-image-wrapper">
                <img src={animal.photo_url} alt={animal.name} className="card-image" />
                <span className="card-badge">{animal.animal_types?.icon} {animal.animal_types?.name}</span>
              </div>
              <div className="card-body">
                <h4 className="card-name">{animal.name}</h4>
                {animal.location_name && (
                  <p className="card-location">
                    <MapPin size={12} /> {animal.location_name}
                  </p>
                )}
                <p className="card-date">
                  <Calendar size={12} />{' '}
                  {format(new Date(animal.captured_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                </p>
              </div>
              <div className="card-actions">
                <button type="button" className="card-action-btn" title="Lihat" onClick={() => { setSelectedAnimal(animal); setShowDetail(true) }}>
                  <Eye size={16} />
                </button>
                <Link to={`/edit/${animal.id}`} className="card-action-btn" title="Edit">
                  <Pencil size={16} />
                </Link>
                <button type="button" className="card-action-btn danger" title="Hapus" onClick={() => setDeletingId(animal.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={selectedAnimal?.name ?? ''} size="lg">
        {selectedAnimal && (
          <div className="detail-content">
            <img src={selectedAnimal.photo_no_bg_url || selectedAnimal.photo_url} alt={selectedAnimal.name} className="detail-photo" />
            <div className="detail-info">
              <div className="detail-row">
                <strong>Jenis:</strong> {selectedAnimal.animal_types?.icon} {selectedAnimal.animal_types?.name}
              </div>
              <div className="detail-row">
                <strong>Tanggal Foto:</strong>{' '}
                {format(new Date(selectedAnimal.captured_at), 'EEEE, dd MMMM yyyy • HH:mm', { locale: id })}
              </div>
              {selectedAnimal.location_name && (
                <div className="detail-row">
                  <strong>Lokasi:</strong> <MapPin size={14} /> {selectedAnimal.location_name}
                </div>
              )}
              {selectedAnimal.latitude && selectedAnimal.longitude && (
                <div className="detail-row">
                  <strong>Koordinat:</strong> {selectedAnimal.latitude.toFixed(6)}, {selectedAnimal.longitude.toFixed(6)}
                  <a
                    href={`https://www.google.com/maps?q=${selectedAnimal.latitude},${selectedAnimal.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                    Buka di Maps ↗
                  </a>
                </div>
              )}
              {selectedAnimal.description && (
                <div className="detail-row">
                  <strong>Deskripsi:</strong> {selectedAnimal.description}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Hapus Anabul?" size="sm">
        <p style={{ marginBottom: 20, color: 'var(--text)' }}>
          Yakin mau hapus anabul ini? Data yang sudah dihapus tidak bisa dikembalikan.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setDeletingId(null)}>Batal</Button>
          <Button variant="danger" onClick={() => deletingId && handleDelete(deletingId)}>Hapus</Button>
        </div>
      </Modal>
    </div>
  )
}
