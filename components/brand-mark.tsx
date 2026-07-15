export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span className="brand-lockup" aria-label="Odd One">
    <svg className="brand-symbol" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="16" cy="18" r="3" fill="currentColor" /><circle cx="32" cy="18" r="3" fill="currentColor" />
      <circle cx="16" cy="31" r="3" fill="currentColor" /><circle cx="32" cy="31" r="5" className="brand-odd" />
    </svg>
    {!compact && <span className="brand-name">Odd One</span>}
  </span>;
}
