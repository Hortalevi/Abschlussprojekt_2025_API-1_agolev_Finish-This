import "./CountdownBar.css"

interface Props {
  readonly secondsLeft: number
  readonly totalSeconds: number
}

export default function CountdownBar({ secondsLeft, totalSeconds }: Props) {
  const percentage = Math.max(0, (secondsLeft / totalSeconds) * 100)

  return (
    <div className="countdown-container">
      <div className="countdown-background">
        <div className="countdown-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="countdown-text">{secondsLeft}s</div>
    </div>
  )
}
