/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-03 08:51:02
 * @ Modified by: Your name
 * @ Modified time: 2025-06-29 16:16:24
 * @ Description: Game-Screen so that Players can play the Game, this is per say the main function of the code
 * * @ Sources: Chatgpt and Claude AI, for Problems and Questions
 */

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import "./GameScreen.css"
import {
  submitSentence,
  vote,
  getSentences,
  isRoomReady,
  getStarter,
  hasEveryoneVoted,
  getRound,
  advanceRound,
  getBestSentences,
} from "../../api/api"
import type { SentenceEntry } from "../../types/types"

// Emoji voting options and their point values
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

// Returns a medal emoji or rank number for podium
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

// Calls backend to update scores after voting
async function updateScores(roomCode: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/calculate-scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomCode }),
    })
    if (!response.ok) {
      throw new Error("Failed to update scores")
    }
  } catch (error) {
    console.error("Error updating scores:", error)
  }
}

// Fetches the player ranking from backend
async function getRanking(roomCode: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/ranking/${roomCode}`)
    if (!response.ok) {
      throw new Error("Failed to get ranking")
    }
    return await response.json()
  } catch (error) {
    console.error("Error getting ranking:", error)
    return []
  }
}

export default function GameScreen({ nickname, roomCode }: Props) {
  // State for sentence input, round, votes, and UI
  const [starter, setStarter] = useState("")
  const [sentence, setSentence] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [showAllSentences, setShowAllSentences] = useState(false)
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({})
  const [shuffledSentences, setShuffledSentences] = useState<SentenceEntry[]>([])
  const [bestSentences, setBestSentences] = useState<SentenceEntry[]>([])

  const [allVoted, setAllVoted] = useState(false)
  const [round, setRound] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [pollIntervalId, setPollIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)
  const [showPodium, setShowPodium] = useState(false)
  const [totalScores, setTotalScores] = useState<Record<string, number>>({})

  // Handles setup for a new round
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

  // Polls for round changes, voting status, and updates scores/ranking
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const currentRound = await getRound(roomCode)
        if (currentRound !== round) {
          setRound(currentRound)
          await handleNewRound()
        }

        if (!starter) {
          const res = await getStarter(roomCode)
          setStarter(res.starter)
        }

        if (showAllSentences && !allVoted) {
          const res = await hasEveryoneVoted(roomCode)
          if (res.allVoted) {
            setAllVoted(true)

            await updateScores(roomCode)

            const ranking = await getRanking(roomCode)
            const newScores: Record<string, number> = {}
            ranking.forEach((player: { nickname: string; total_points: number }) => {
              newScores[player.nickname] = player.total_points
            })
            setTotalScores(newScores)
          }
        }

        if (currentRound > 3 && !showPodium) {
          setShowPodium(true)
        }
      } catch (error) {
        console.error("Polling error:", error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [roomCode, starter, showAllSentences, allVoted, round, showPodium, handleNewRound, totalScores])

  // Handles sentence submission
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

  // Polls until all players have submitted their sentences
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

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId)
    }
  }, [pollIntervalId])

  // Handles voting for a sentence with an emoji
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

  // Advances to the next round
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

  // Fetches best sentences for the podium view
  useEffect(() => {
    if (showPodium) {
      getBestSentences(roomCode)
        .then(setBestSentences)
        .catch((err) => console.error("Error fetching best sentences:", err))
    }
  }, [showPodium, roomCode])

  // Renders the main content for each game phase
  const renderContent = () => {
    if (showPodium) {
      console.log("Best sentences from backend:", bestSentences);
      const sortedSentences = [...bestSentences].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

      const sortedPlayers = Object.entries(totalScores).sort(([, a], [, b]) => b - a)

      return (
        <div className="results-container">
          <div className="results-header">
            <h2 className="results-title">🏁 Final Results</h2>
          </div>

          <div className="results-section">
            <h3 className="section-title">🏆 Best Sentences (Ranking)</h3>
            <div className="sentence-container">
              {sortedSentences.map((entry, idx) => {
                const votes = entry.votes || []
                const summary = votes.reduce((acc: Record<string, number>, emoji) => {
                  acc[emoji] = (acc[emoji] || 0) + 1
                  return acc
                }, {})

                return (
                  <div key={entry.id} className="sentence-card">
                    <div className="sentence-content">
                      <div className="sentence-header">
                        <div className="sentence-text">
                          <strong>{idx + 1}.</strong> {entry.text}
                        </div>
                        <div className="sentence-score">
                          <strong>{entry.score} Punkte</strong>
                        </div>
                      </div>
                      {Object.keys(summary).length > 0 && (
                        <div className="vote-summary">
                          {Object.entries(summary).map(([emoji, count]) => (
                            <span key={emoji} className="vote-badge">
                              {emoji} <strong>×{count}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="sentence-author">✍️ {entry.author}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="results-section podium-section">
            <h3 className="section-title">👑 Top Authors</h3>
            <p className="section-subtitle">Based on total points from all sentences</p>

            <div className="podium-container">
              {sortedPlayers.slice(0, 3).map(([player, score], idx) => (
                <div key={player} className={`podium-step ${idx === 0 ? "first" : idx === 1 ? "second" : "third"}`}>
                  <div className="player-info">
                    <div className="medal">{getMedal(idx)}</div>
                    <div className="player-name">{player}</div>
                    <div className="player-score">{score} Punkte</div>
                  </div>
                  <div className="step-base"></div>
                </div>
              ))}
            </div>

            {sortedPlayers.length > 3 && (
              <div className="remaining-players">
                <h4>Weitere Plätze</h4>
                <div className="player-list">
                  {sortedPlayers.slice(3).map(([player, score], idx) => (
                    <div key={player} className="player-item">
                      <span className="player-rank">{idx + 4}.</span>
                      <span className="player-name">{player}</span>
                      <span className="player-score">{score} Punkte</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="results-footer">
            <button className="button-join" onClick={() => window.location.reload()}>
              🔙 Back to the Lobby
            </button>
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
              <li key={entry.id}>
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
          <div className="button-container">
            {round < 3 ? (
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
          <div className="button-container">
            <div style={{ fontStyle: "italic", color: "#ccc", fontSize: "0.9rem" }}>
              Waiting for everyone to vote...
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`form-container-GameScreen ${showPodium ? "results-mode" : ""}`}>
      <h2>Hi {nickname}, your sentence is:</h2>
      <div className="starter-sentence">{starter}</div>

      {/* Main game content (submission, voting, results, etc.) */}
      {renderContent()}

      <div className="game-info">
        Room: {roomCode} | Round: {round}
      </div>
    </div>
  )
}