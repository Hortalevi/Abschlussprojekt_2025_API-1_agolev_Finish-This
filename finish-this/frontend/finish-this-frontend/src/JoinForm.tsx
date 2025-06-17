"use client"

import type React from "react"

import { useState } from "react"
import { joinRoom, createRoom } from "./api"
import "./JoinForm.css"

interface Props {
  readonly onJoin: (nickname: string, roomCode: string) => void
}

interface Notification {
  message: string
  type: "success" | "error" | "info"
}

export default function JoinForm({ onJoin }: Props) {
  const [nickname, setNickname] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleSubmitJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const roomCodePattern = /^\d{4}$/

    if (!nickname.trim()) {
      return showNotification("Please enter your nickname", "error")
    }

    if (!roomCode) {
      return showNotification("Please enter a room code", "error")
    }

    if (!roomCodePattern.test(roomCode)) {
      return showNotification("Room code must be exactly 4 digits", "error")
    }

    setIsLoading(true)
    try {
      await joinRoom(roomCode, nickname.trim())
      showNotification("Successfully joined room!", "success")
      setTimeout(() => onJoin(nickname.trim(), roomCode), 1000)
    } catch {
      showNotification("Failed to join room. Please check the room code.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      return showNotification("Please enter your nickname first", "error")
    }

    setIsLoading(true)
    try {
      const generatedRoomCode = await createRoom(nickname.trim())
      showNotification(`Room created! Code: ${generatedRoomCode}`, "success")
      setTimeout(() => onJoin(nickname.trim(), generatedRoomCode), 1500)
    } catch {
      showNotification("Failed to create room. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const formatRoomCode = (value: string) => {
    return value.replace(/(\d)(?=\d)/g, "$1 ")
  }

  return (
    <div className="join-form-wrapper">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === "success" && "✓"}
              {notification.type === "error" && "⚠"}
              {notification.type === "info" && "ℹ"}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button className="notification-close" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      )}

      <div className="game-options-container">
        {/* Nickname Section - Shared */}
        <div className="nickname-section">
          <h2 className="main-title">🎮 Join the Game</h2>
          <p className="main-subtitle">Enter your nickname to get started</p>

          <div className="input-group">
            <label htmlFor="nickname" className="input-label">
              <span className="label-icon">👤</span>
              Nickname
            </label>
            <input
              id="nickname"
              className="input-field-enhanced"
              type="text"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={isLoading}
            />
            <div className="input-helper">{nickname.length}/20 characters</div>
          </div>
        </div>

        {/* Two Options Side by Side */}
        <div className="options-grid">
          {/* Join Room Option */}
          <div className="option-card join-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🚪</span>
                Join Existing Room
              </h3>
              <p className="card-subtitle">Enter a 4-digit room code</p>
            </div>

            <form onSubmit={handleSubmitJoin} className="card-form">
              <div className="input-group">
                <label htmlFor="roomCode" className="input-label">
                  <span className="label-icon">🔑</span>
                  Room Code
                </label>
                <input
                  id="roomCode"
                  className="input-field-enhanced room-code-input"
                  type="text"
                  placeholder="0000"
                  value={formatRoomCode(roomCode)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, "")
                    if (/^\d{0,4}$/.test(value)) {
                      setRoomCode(value)
                    }
                  }}
                  maxLength={7}
                  disabled={isLoading}
                />
                <div className="input-helper">4-digit room code</div>
              </div>

              <button className="button-primary" type="submit" disabled={isLoading || !nickname.trim() || !roomCode}>
                <span className="button-text">{isLoading ? "Joining..." : "Join Room"}</span>
                {isLoading && <div className="button-spinner"></div>}
              </button>
            </form>
          </div>

          {/* Create Room Option */}
          <div className="option-card create-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">➕</span>
                Create New Room
              </h3>
              <p className="card-subtitle">Start a new game session</p>
            </div>

            <div className="card-form">
              <div className="create-info">
                <div className="info-item">
                  <span className="info-icon">🎯</span>
                  <span>Up to 8 players</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">⏱️</span>
                  <span>7 rounds of fun</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🏆</span>
                  <span>Vote for the best</span>
                </div>
              </div>

              <button
                className="button-secondary"
                type="button"
                onClick={handleCreateRoom}
                disabled={isLoading || !nickname.trim()}
              >
                <span className="button-text">{isLoading ? "Creating..." : "Create Room"}</span>
                {isLoading && <div className="button-spinner"></div>}
              </button>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <p className="footer-text">🎯 Complete sentences and vote for the funniest ones!</p>
        </div>
      </div>
    </div>
  )
}
