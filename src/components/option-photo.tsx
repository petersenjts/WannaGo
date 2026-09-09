/**
 * Renders a shortlist option's photo, or a neutral placeholder when it
 * doesn't have one yet — used everywhere an option's image shows up
 * (portal shortlist cards, admin's shortlist preview) so there's one
 * consistent "no photo" treatment instead of broken-image icons.
 */
export function OptionPhoto({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-paper-alt ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-1/3 w-1/3 text-muted"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5.5-5.5a1 1 0 0 0-1.4 0L6 18" />
      </svg>
    </div>
  );
}
