/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-11 13:28:57
 * @ Modified by: Your name
 * @ Modified time: 2025-06-25 15:44:32
 * @ Description: Component that makes the Countdown for the Game to start.
 * @ Sources: Chatgpt and Claude AI, for Problems and Questions.
 */

import "./CountdownBar.css"

interface Props {
  readonly secondsLeft: number
  readonly totalSeconds: number
}

export default function CountdownBar({ secondsLeft, totalSeconds }: Props) {
  // Calculate fill percentage for the countdown bar (never below 0%)
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
