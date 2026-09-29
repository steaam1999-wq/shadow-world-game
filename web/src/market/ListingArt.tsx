import type { Listing } from '../types'

// Обложка объявления без фото: предмет-пиктограмма на мягком градиенте категории.
const ART: Record<string, { hue: number; draw: string }> = {
  'Электроника': { hue: 220, draw: 'M28 22h44a6 6 0 0 1 6 6v44a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6zM38 88h24M50 78v10M40 40h20v14H40z' },
  'Одежда': { hue: 20, draw: 'M38 22l-18 10 8 16 8-4v38h28V44l8 4 8-16-18-10c-2 6-7 9-12 9s-10-3-12-9z' },
  'Дом': { hue: 40, draw: 'M34 30h32l8 26H26zM50 56v24M36 82h28M50 30v-8' },
  'Хобби': { hue: 280, draw: 'M24 36h52a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V42a6 6 0 0 1 6-6zM40 36l4-8h12l4 8M50 68a11 11 0 1 0 0-22 11 11 0 0 0 0 22z' },
  'Спорт': { hue: 150, draw: 'M50 80a30 30 0 1 0 0-60 30 30 0 0 0 0 60zM20 50h60M50 20c-12 10-12 50 0 60M50 20c12 10 12 50 0 60' },
  'Детям': { hue: 330, draw: 'M30 66a12 12 0 1 0 0 .1M70 66a12 12 0 1 0 0 .1M30 66l14-24h18l8 24M44 42l-4-10h-6M58 42l4-10' },
  'Книги': { hue: 10, draw: 'M24 26h22a6 6 0 0 1 6 6v48a5 5 0 0 0-5-5H24zM76 26H56a6 6 0 0 0-6 6v48a5 5 0 0 1 5-5h21z' },
  'Бесплатно': { hue: 100, draw: 'M24 44h52v12H24zM28 56h44v24H28zM50 44v36M50 44c-4-12-18-14-18-4 0 4 8 4 18 4zM50 44c4-12 18-14 18-4 0 4-8 4-18 4z' },
}

export function ListingArt({ listing, className = '' }: { listing: Pick<Listing, 'id' | 'category' | 'photo'>; className?: string }) {
  if (listing.photo) return <img src={listing.photo} alt="" className={`w-full h-full object-cover ${className}`} />
  const a = ART[listing.category] ?? ART['Дом']
  let h = 0
  for (const ch of listing.id) h = (h * 31 + ch.charCodeAt(0)) | 0
  const hue = (a.hue + (Math.abs(h) % 30) - 15 + 360) % 360
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={`w-full h-full block ${className}`} aria-hidden="true"
      style={{ background: `radial-gradient(90% 80% at 25% 20%, hsl(${hue} 80% 88%), transparent 60%), linear-gradient(145deg, hsl(${hue} 60% 76%), hsl(${(hue + 30) % 360} 55% 60%))` }}>
      <path d={a.draw} fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
