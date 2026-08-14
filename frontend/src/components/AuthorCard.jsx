import { useSettings } from '../context/SettingsContext'
import './AuthorCard.css'

function AuthorCard({ authorName }) {
  const { settings } = useSettings()
  const name = authorName || settings?.author_name || 'Editor'
  const role = settings?.author_role || 'Writer'
  const bio =
    settings?.author_bio ||
    'Writes for BlogSite on culture, focus, sport, and everyday life.'
  const image = settings?.author_image

  return (
    <section className="author-card" aria-label="Author details">
      <p className="author-card-kicker">About the author</p>
      <div className="author-card-body">
        {image ? (
          <img src={image} alt="" width={96} height={96} />
        ) : (
          <div className="author-card-avatar" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2>{name}</h2>
          <p className="author-card-role">{role}</p>
          <p className="author-card-bio">{bio}</p>
        </div>
      </div>
    </section>
  )
}

export default AuthorCard
