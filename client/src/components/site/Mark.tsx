export function Mark({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`brand-mark ${dark ? "brand-mark-dark" : ""}`}
      aria-hidden="true"
    >
      <span />
    </span>
  );
}
