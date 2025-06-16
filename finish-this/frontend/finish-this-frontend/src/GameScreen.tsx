import type React from "react"

import { useEffect, useState, useCallback } from "react"
import "./GameScreen.css"
import type { SentenceEntry } from "./types"
import {
  submitSentence,
  vote,
  getSentences,
  isRoomReady,
  getStarter,
  getRoomStatus,
  hasEveryoneVoted,
  getRound,
  advanceRound,
} from "./api"
import CountdownBar from "./components/CountdownBar"

const emojis = ["😍", "😂", "🤔", "💩"]
const emojiPoints: { [emoji: string]: number } = {
  "😍": 3,
  "😂": 2,
  "🤔": 1,
  "💩": 0,
}

interface Props {
  readonly nickname: string
  readonly roomCode: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function getMedal(index: number): string {
  switch (index) {
    case 0:
      return "🥇"
    case 1:
      return "🥈"
    case 2:
      return "🥉"
    default:
      return `${index + 1}.`
  }
}

export default function GameScreen({ nickname, roomCode }: Props) {
  const [starter, setStarter] = useState("")
  const [sentence, setSentence] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [showAllSentences, setShowAllSentences] = useState(false)
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({})
  const [shuffledSentences, setShuffledSentences] = useState<SentenceEntry[]>([])
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [allVoted, setAllVoted] = useState(false)
  const [round, setRound] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [pollIntervalId, setPollIntervalId] = useState<number | null>(null)
  const [showPodium, setShowPodium] = useState(false)

  const handleNewRound = useCallback(async () => {
    setSentence("")
    setSubmitted(false)
    setShowAllSentences(false)
    setShuffledSentences([])
    setUserVotes({})
    setAllVoted(false)
    try {
      const res = await getStarter(roomCode)
      setStarter(res.starter)
    } catch (error) {
      console.error("Failed to fetch new starter:", error)
    }
  }, [roomCode])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await getRoomStatus(roomCode)
        setSecondsLeft(status.secondsLeft)
        setGameStarted(status.started)

        const currentRound = await getRound(roomCode)
        if (currentRound !== round) {
          setRound(currentRound)
          await handleNewRound()
        }

        if (status.started && !starter) {
          const res = await getStarter(roomCode)
          setStarter(res.starter)
        }

        if (showAllSentences && !allVoted) {
          const res = await hasEveryoneVoted(roomCode)
          if (res.allVoted) setAllVoted(true)
        }

        if (currentRound > 7 && !showPodium) {
          setShowPodium(true)
        }
      } catch (error) {
        console.error("Polling error:", error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [roomCode, starter, showAllSentences, allVoted, round, showPodium, handleNewRound])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sentence.trim() === "") return alert("Please write a sentence.")
    if (sentence.length > 200) return alert("Max 200 characters.")

    setIsLoading(true)
    try {
      await submitSentence(roomCode, nickname, sentence)
      setSubmitted(true)
      pollUntilAllSubmitted()
    } catch (error) {
      console.error("Error submitting sentence:", error)
      alert("Could not submit sentence.")
    } finally {
      setIsLoading(false)
    }
  }

  const pollUntilAllSubmitted = useCallback(() => {
    if (pollIntervalId) clearInterval(pollIntervalId)

    const id = setInterval(async () => {
      try {
        const { ready } = await isRoomReady(roomCode)
        if (ready) {
          clearInterval(id)
          setPollIntervalId(null)
          const serverSentences = await getSentences(roomCode)
          setShuffledSentences(serverSentences)
          setShowAllSentences(true)
        }
      } catch (error) {
        console.error("Polling submission error:", error)
      }
    }, 1000)

    setPollIntervalId(id)
  }, [roomCode, pollIntervalId])

  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId)
    }
  }, [pollIntervalId])

  const handleVote = async (sentenceId: string, emoji: string) => {
    setUserVotes((prev) => {
      const updated = { ...prev }
      if (updated[sentenceId] === emoji) {
        delete updated[sentenceId]
      } else {
        updated[sentenceId] = emoji
      }
      return updated
    })

    try {
      await vote(roomCode, sentenceId, nickname, emoji)
    } catch (error) {
      console.error("Vote failed:", error)
      alert("Voting failed.")
      setUserVotes((prev) => {
        const updated = { ...prev }
        delete updated[sentenceId]
        return updated
      })
    }
  }

  const triggerNextRound = async () => {
    setIsLoading(true)
    try {
      await advanceRound(roomCode)
    } catch (error) {
      console.error("Failed to advance round:", error)
      alert("Failed to advance round.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    if (showPodium) {
      const sentenceScores = shuffledSentences.map((s) => {
        const score = (s.votes || []).reduce((sum, emoji) => sum + (emojiPoints[emoji] || 0), 0)
        return { ...s, score }
      })

      const maxScore = Math.max(...sentenceScores.map((s) => s.score))
      const winningIds = sentenceScores.filter((s) => s.score === maxScore).map((s) => s.id)

      const totals: Record<string, number> = {}
      sentenceScores.forEach(({ author, score }) => {
        totals[author] = (totals[author] || 0) + score
      })

      const sortedPlayers = Object.entries(totals).sort(([, a], [, b]) => b - a)

      return (
        <div className="result-section">
          <h2>🏁 Final Results</h2>
          <ul className="sentence-list">
            {sentenceScores.map((entry) => {
              const votes = entry.votes || []
              const summary = votes.reduce((acc: Record<string, number>, emoji) => {
                acc[emoji] = (acc[emoji] || 0) + 1
                return acc
              }, {})
              return (
                <li
                  key={entry.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    // Goldener Rahmen nur für die Gewinner-Sätze im Podium
                    border: winningIds.includes(entry.id) ? "2px solid gold" : "none",
                    borderRadius: "8px",
                    padding: "10px",
                    marginBottom: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div>
                    <strong>Someone:</strong> {entry.text}
                    {Object.keys(summary).length > 0 && (
                      <div style={{ fontSize: "0.85rem", marginTop: "4px", color: "#aaa" }}>
                        {Object.entries(summary).map(([emoji, count]) => (
                          <span key={emoji} style={{ marginRight: "8px" }}>
                            {emoji} x{count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#ccc",
                      fontStyle: "italic",
                      marginLeft: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✍️ {entry.author}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="podium" style={{ marginTop: "2rem" }}>
            <h3>🏆 Podium</h3>
            <ol>
              {sortedPlayers.map(([player, score], idx) => (
                <li key={player} style={{ fontWeight: idx === 0 ? "bold" : "normal" }}>
                  {getMedal(idx)} {player} – {score} Punkte
                </li>
              ))}
            </ol>
          </div>
        </div>
      )
    }

    if (!submitted) {
      return (
        <form onSubmit={handleSubmit}>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder="Finish the sentence..."
            className="input-field"
            disabled={isLoading}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#ccc" }}>{sentence.length}/200 characters</span>
          </div>
          <button type="submit" className="button-join" disabled={isLoading || sentence.trim() === ""}>
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
      )
    }

    if (!showAllSentences) {
      return (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ fontStyle: "italic" }}>Your sentence was submitted!</p>
          <p className="waiting-message">
            Waiting for other players<span className="dots"></span>
          </p>
        </div>
      )
    }

    // Voting-Phase: KEIN goldener Rahmen hier
    return (
      <div className="result-section">
        <p className="waiting-message">All players submitted! Here are the sentence endings:</p>
        <ul className="sentence-list">
          {shuffledSentences.map((entry) => {
            const isOwn = entry.text === sentence
            const summary = (entry.votes || []).reduce((acc: Record<string, number>, emoji) => {
              acc[emoji] = (acc[emoji] || 0) + 1
              return acc
            }, {})
            return (
              <li
                key={entry.id}
                style={{
                  // Kein goldener Rahmen in der Voting-Phase
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px",
                  marginBottom: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <strong>Someone:</strong> {entry.text}
                {Object.keys(summary).length > 0 && (
                  <div style={{ fontSize: "0.85rem", marginTop: "4px", color: "#aaa" }}>
                    {Object.entries(summary).map(([emoji, count]) => (
                      <span key={emoji} style={{ marginRight: "8px" }}>
                        {emoji} x{count}
                      </span>
                    ))}
                  </div>
                )}
                {isOwn ? (
                  <div style={{ marginTop: 5, fontStyle: "italic", color: "#aaa" }}>
                    (You can't vote on your own sentence)
                  </div>
                ) : (
                  <div className="emoji-buttons">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleVote(entry.id, emoji)}
                        className={`emoji-button ${userVotes[entry.id] === emoji ? "selected" : ""}`}
                        disabled={isLoading}
                        title={`Gibt ${emojiPoints[emoji]} Punkt(e)`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {!isOwn && userVotes[entry.id] && (
                  <div className="emoji-display">
                    You voted: <span>{userVotes[entry.id]}</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {allVoted ? (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            {round < 7 ? (
              <button onClick={triggerNextRound} className="button-join" disabled={isLoading}>
                {isLoading ? "Starting..." : "🔁 Start New Round"}
              </button>
            ) : (
              <button onClick={() => setShowPodium(true)} className="button-join" disabled={isLoading}>
                🏁 Show Final Ranking
              </button>
            )}
          </div>
        ) : (
          <div style={{ marginTop: "1rem", textAlign: "center", fontStyle: "italic", color: "#ccc" }}>
            Waiting for everyone to vote...
          </div>
        )}
      </div>
    )
  }

  if (!gameStarted) {
    return (
      <div className="form-container-GameScreen">
        <h2>Waiting for other players...</h2>
        <p>
          Game will start in <strong>{secondsLeft !== null ? formatTime(secondsLeft) : "..."}</strong>
        </p>
        {secondsLeft !== null && <CountdownBar secondsLeft={secondsLeft} totalSeconds={90} />}
        <p style={{ marginTop: "2rem", fontStyle: "italic", color: "#ccc" }}>Room: {roomCode}</p>
      </div>
    )
  }

  return (
    <div className="form-container-GameScreen">
      <h2>Hi {nickname}, your sentence is:</h2>
      <p
        style={{
          fontSize: "1.3rem",
          fontWeight: "bold",
          marginTop: "1rem",
          backgroundColor: "rgba(255,255,255,0.1)",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        {starter}
      </p>

      {renderContent()}

      <h4 style={{ marginTop: "1.5rem", fontStyle: "italic", color: "#ccc" }}>
        Room: {roomCode} | Round: {round}
      </h4>
    </div>
  )
}