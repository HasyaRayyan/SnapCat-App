import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, Cat, ExternalLink } from 'lucide-react'
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

  const { animals, loading, deleteAnimal } = useAnimals({
    searchQuery,
    typeId: selectedTypeId || undefined,
    sortField,
    sortOrder,
  })
  const { types } = useAnimalTypes()

  // Spotlight carousel state
  const [spotlightIndex, setSpotlightIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-cycle spotlight image every 4.5 seconds
  useEffect(() => {
    if (animals.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % animals.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [animals.length, isPaused])

  const activeSpotlight = animals.length > 0 ? animals[spotlightIndex % animals.length] : null

  const handleNextSpotlight = () => {
    if (animals.length > 1) {
      setSpotlightIndex((prev) => (prev + 1) % animals.length)
    }
  }

  const handlePrevSpotlight = () => {
    if (animals.length > 1) {
      setSpotlightIndex((prev) => (prev - 1 + animals.length) % animals.length)
    }
  }

  // Detail modal
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalWithType | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (animalId: string) => {
    await deleteAnimal(animalId)
    setDeletingId(null)
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
        <div className="dashboard-title-wrap">
          <h1>{greeting()}, {profile?.full_name ?? 'Teman'}</h1>
          <p className="subtitle">
            Koleksi satwa terlacak • <strong>{animals.length}</strong> anabul terdata di StrayDex
          </p>
        </div>
      </div>

      {/* Rotating Animal Spotlight */}
      <div
        className="spotlight-card"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="spotlight-header">
          <div className="spotlight-title-group">
            <h2 className="spotlight-title">Sorotan Anabul</h2>
            {animals.length > 1 && (
              <span className="spotlight-counter">
                {(spotlightIndex % animals.length) + 1} / {animals.length}
              </span>
            )}
          </div>
          {animals.length > 1 && (
            <div className="spotlight-nav-btns">
              <button
                type="button"
                className="spotlight-nav-btn"
                onClick={handlePrevSpotlight}
                title="Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="spotlight-nav-btn"
                onClick={handleNextSpotlight}
                title="Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="spotlight-loading">
            <LoadingSpinner size={24} />
          </div>
        ) : activeSpotlight ? (
          <div className="spotlight-content" key={activeSpotlight.id}>
            <div
              className="spotlight-photo-frame"
              onClick={() => { setSelectedAnimal(activeSpotlight); setShowDetail(true) }}
              title="Klik untuk melihat detail"
            >
              <img
                src={activeSpotlight.photo_no_bg_url || activeSpotlight.photo_url}
                alt={activeSpotlight.name}
                className={`spotlight-photo ${activeSpotlight.photo_no_bg_url ? 'is-cutout' : ''}`}
              />
              <span className="spotlight-zoom-hint">Lihat Detail</span>
            </div>
            <div className="spotlight-info">
              <div className="spotlight-meta-top">
                <span className="animal-tag">
                  {activeSpotlight.animal_types?.name || 'Anabul'}
                </span>
              </div>
              <h3
                className="spotlight-name"
                onClick={() => { setSelectedAnimal(activeSpotlight); setShowDetail(true) }}
              >
                {activeSpotlight.name}
              </h3>
              {activeSpotlight.location_name && (
                <p className="spotlight-location">
                  <MapPin size={14} /> {activeSpotlight.location_name}
                </p>
              )}
              <p className="spotlight-date">
                <Calendar size={14} />{' '}
                {format(new Date(activeSpotlight.captured_at), 'EEEE, dd MMMM yyyy • HH:mm', { locale: id })}
              </p>
              {activeSpotlight.description && (
                <p className="spotlight-desc">{activeSpotlight.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="spotlight-empty">
            <Cat size={38} color="var(--accent)" strokeWidth={1.5} />
            <p>Belum ada anabul yang dikoleksi. Buka menu Tambah untuk mulai mendata!</p>
          </div>
        )}

        {animals.length > 1 && (
          <div className="spotlight-dots">
            {animals.slice(0, 8).map((a, idx) => (
              <button
                key={a.id}
                type="button"
                className={`spotlight-dot ${idx === (spotlightIndex % animals.length) ? 'active' : ''}`}
                onClick={() => setSpotlightIndex(idx)}
                title={`Lihat ${a.name}`}
              />
            ))}
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
                  {t.name}
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
          <div className="empty-icon">
            <Cat size={44} strokeWidth={1.5} color="var(--accent)" />
          </div>
          <h3>Belum Ada Anabul Terdata</h3>
          <p>Mulai catat anabul liar yang kamu temui melalui menu Tambah.</p>
        </div>
      ) : (
        <div className="animals-grid">
          {animals.map((animal) => (
            <div key={animal.id} className="animal-card">
              <div className="card-image-wrapper">
                <img
                  src={animal.photo_no_bg_url || animal.photo_url}
                  alt={animal.name}
                  className={`card-image ${animal.photo_no_bg_url ? 'is-cutout' : ''}`}
                />
                <span className="card-tag">{animal.animal_types?.name}</span>
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
            <img
              src={selectedAnimal.photo_no_bg_url || selectedAnimal.photo_url}
              alt={selectedAnimal.name}
              className={`detail-photo ${selectedAnimal.photo_no_bg_url ? 'is-cutout' : ''}`}
            />
            <div className="detail-info">
              <div className="detail-row">
                <strong>Jenis:</strong> {selectedAnimal.animal_types?.name}
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
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Buka di Maps <ExternalLink size={12} />
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
