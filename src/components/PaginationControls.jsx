export default function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
  ariaLabel,
  classPrefix
}) {
  return (
    <div className={`${classPrefix}-pagination app-pagination`} aria-label={ariaLabel}>
      <button
        type="button"
        className={`${classPrefix}-page-btn app-pagination-btn`}
        onClick={onPrev}
        disabled={page === 1}
      >
        <span aria-hidden="true">←</span> Prev
      </button>
      <span className={`${classPrefix}-page-info app-pagination-info`}>Page {page} of {totalPages}</span>
      <button
        type="button"
        className={`${classPrefix}-page-btn app-pagination-btn`}
        onClick={onNext}
        disabled={page === totalPages}
      >
        Next <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
