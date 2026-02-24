export default function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
  ariaLabel,
  classPrefix
}) {
  return (
    <div className={`${classPrefix}-pagination`} aria-label={ariaLabel}>
      <button className={`${classPrefix}-page-btn`} onClick={onPrev} disabled={page === 1}>
        ← Prev
      </button>
      <span className={`${classPrefix}-page-info`}>Page {page} of {totalPages}</span>
      <button className={`${classPrefix}-page-btn`} onClick={onNext} disabled={page === totalPages}>
        Next →
      </button>
    </div>
  );
}
