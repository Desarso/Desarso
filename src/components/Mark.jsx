// Two rings that fold into each other: the old "thinking circle", redrawn in
// the site's own accent so it follows light and dark mode.
export default function Mark({ size = 28, className = '' }) {
  return (
    <svg className={`mark ${className}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <g transform="translate(20 20)">
        <circle className="mark-ring mark-a" r="13" />
        <circle className="mark-ring mark-b" r="13" />
      </g>
    </svg>
  )
}
