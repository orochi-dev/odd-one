;; Odd One - lowest unique number wins.

(define-constant MAX_PLAYERS u12)
(define-constant MIN_REVEALS u3)
(define-constant MAX_NUMBER u20)
(define-constant COMMIT_DURATION u1200)
(define-constant REVEAL_DURATION u600)
(define-constant ZERO_HASH 0x0000000000000000000000000000000000000000000000000000000000000000)
(define-constant NUMBERS (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20))

(define-constant ERR_INVALID_COMMITMENT (err u400))
(define-constant ERR_INVALID_NUMBER (err u401))
(define-constant ERR_ROOM_NOT_FOUND (err u402))
(define-constant ERR_COMMIT_CLOSED (err u403))
(define-constant ERR_REVEAL_NOT_OPEN (err u404))
(define-constant ERR_REVEAL_CLOSED (err u405))
(define-constant ERR_REVEAL_STILL_OPEN (err u406))
(define-constant ERR_ROOM_FULL (err u407))
(define-constant ERR_ALREADY_COMMITTED (err u408))
(define-constant ERR_ACTIVE_ROOM (err u409))
(define-constant ERR_NOT_COMMITTED (err u410))
(define-constant ERR_ALREADY_REVEALED (err u411))
(define-constant ERR_INVALID_REVEAL (err u412))
(define-constant ERR_TOO_EARLY (err u413))
(define-constant ERR_FINALIZED (err u414))
(define-constant ERR_INDEX (err u415))

(define-data-var total-rooms uint u0)

(define-map rooms uint {
  creator: principal,
  listed: bool,
  created-at: uint,
  commit-end-at: uint,
  reveal-end-at: uint,
  committed-count: uint,
  revealed-count: uint,
  finalized: bool,
  outcome: uint,
  winning-number: uint,
  winner: (optional principal)
})

(define-map entries { room-id: uint, player: principal } {
  commitment: (buff 32),
  revealed: bool,
  number: uint
})
(define-map participants { room-id: uint, index: uint } principal)
(define-map number-counts { room-id: uint, number: uint } uint)
(define-map first-pickers { room-id: uint, number: uint } principal)

(define-map player-stats principal {
  score: uint,
  rooms-played: uint,
  reveals: uint,
  wins: uint,
  number-one-wins: uint,
  current-streak: uint,
  best-streak: uint
})
(define-map last-played-room principal uint)
(define-map created-counts principal uint)
(define-map played-counts principal uint)
(define-map created-ids { player: principal, index: uint } uint)
(define-map played-ids { player: principal, index: uint } uint)

(define-private (empty-stats)
  { score: u0, rooms-played: u0, reveals: u0, wins: u0,
    number-one-wins: u0, current-streak: u0, best-streak: u0 })

(define-private (prepare-player (player principal))
  (match (map-get? last-played-room player)
    previous-id
      (match (map-get? rooms previous-id)
        previous
          (begin
            (asserts! (>= stacks-block-time (get reveal-end-at previous)) ERR_ACTIVE_ROOM)
            (match (map-get? entries { room-id: previous-id, player: player }) previous-entry
              (if (get revealed previous-entry)
                (ok true)
                (let ((current (default-to (empty-stats) (map-get? player-stats player))))
                  (map-set player-stats player (merge current { current-streak: u0 }))
                  (ok true)))
              (ok true))
          )
        (ok true))
    (ok true))
)

(define-private (index-play (player principal) (room-id uint))
  (let (
      (index (default-to u0 (map-get? played-counts player)))
      (current (default-to (empty-stats) (map-get? player-stats player)))
    )
    (map-set played-ids { player: player, index: index } room-id)
    (map-set played-counts player (+ index u1))
    (map-set last-played-room player room-id)
    (map-set player-stats player (merge current { rooms-played: (+ (get rooms-played current) u1) }))
    true
  )
)

(define-private (scan-lowest (number uint) (state { room-id: uint, winner: uint }))
  (if (> (get winner state) u0)
    state
    { room-id: (get room-id state),
      winner: (if (is-eq (default-to u0 (map-get? number-counts {
        room-id: (get room-id state), number: number })) u1) number u0) })
)

(define-private (lowest-for-room (room-id uint))
  (get winner (fold scan-lowest NUMBERS { room-id: room-id, winner: u0 }))
)

(define-read-only (make-commitment (room-id uint) (player principal) (number uint) (salt (buff 32)))
  (ok (sha256 (unwrap-panic (to-consensus-buff? {
    domain: "odd-one-stacks-v1", room-id: room-id, player: player, number: number, salt: salt
  }))))
)

(define-public (create-room (commitment (buff 32)) (listed bool))
  (let (
      (room-id (+ (var-get total-rooms) u1))
      (commit-end (+ stacks-block-time COMMIT_DURATION))
      (reveal-end (+ stacks-block-time COMMIT_DURATION REVEAL_DURATION))
      (created-index (default-to u0 (map-get? created-counts tx-sender)))
    )
    (asserts! (not (is-eq commitment ZERO_HASH)) ERR_INVALID_COMMITMENT)
    (try! (prepare-player tx-sender))
    (map-set rooms room-id {
      creator: tx-sender, listed: listed, created-at: stacks-block-time,
      commit-end-at: commit-end, reveal-end-at: reveal-end,
      committed-count: u1, revealed-count: u0, finalized: false,
      outcome: u0, winning-number: u0, winner: none
    })
    (map-set entries { room-id: room-id, player: tx-sender } { commitment: commitment, revealed: false, number: u0 })
    (map-set participants { room-id: room-id, index: u0 } tx-sender)
    (index-play tx-sender room-id)
    (map-set created-ids { player: tx-sender, index: created-index } room-id)
    (map-set created-counts tx-sender (+ created-index u1))
    (var-set total-rooms room-id)
    (print { event: "room-created", room-id: room-id, creator: tx-sender,
      listed: listed, commit-end-at: commit-end, reveal-end-at: reveal-end })
    (print { event: "number-committed", room-id: room-id, player: tx-sender, player-index: u0 })
    (ok room-id)
  )
)

(define-public (commit-number (room-id uint) (commitment (buff 32)))
  (match (map-get? rooms room-id)
    room
      (begin
        (asserts! (< stacks-block-time (get commit-end-at room)) ERR_COMMIT_CLOSED)
        (asserts! (< (get committed-count room) MAX_PLAYERS) ERR_ROOM_FULL)
        (asserts! (not (is-eq commitment ZERO_HASH)) ERR_INVALID_COMMITMENT)
        (asserts! (is-none (map-get? entries { room-id: room-id, player: tx-sender })) ERR_ALREADY_COMMITTED)
        (try! (prepare-player tx-sender))
        (map-set entries { room-id: room-id, player: tx-sender } { commitment: commitment, revealed: false, number: u0 })
        (map-set participants { room-id: room-id, index: (get committed-count room) } tx-sender)
        (map-set rooms room-id (merge room { committed-count: (+ (get committed-count room) u1) }))
        (index-play tx-sender room-id)
        (print { event: "number-committed", room-id: room-id, player: tx-sender, player-index: (get committed-count room) })
        (ok true)
      )
    ERR_ROOM_NOT_FOUND)
)

(define-public (reveal-number (room-id uint) (number uint) (salt (buff 32)))
  (match (map-get? rooms room-id)
    room
      (begin
        (asserts! (>= stacks-block-time (get commit-end-at room)) ERR_REVEAL_NOT_OPEN)
        (asserts! (< stacks-block-time (get reveal-end-at room)) ERR_REVEAL_CLOSED)
        (asserts! (and (> number u0) (<= number MAX_NUMBER)) ERR_INVALID_NUMBER)
        (match (map-get? entries { room-id: room-id, player: tx-sender }) entry
          (begin
            (asserts! (not (get revealed entry)) ERR_ALREADY_REVEALED)
            (let (
                (commitment-room-id (if (is-eq tx-sender (get creator room)) u0 room-id))
                (expected (sha256 (unwrap-panic (to-consensus-buff? {
                  domain: "odd-one-stacks-v1", room-id: commitment-room-id, player: tx-sender, number: number, salt: salt
                }))))
                (count (default-to u0 (map-get? number-counts { room-id: room-id, number: number })))
                (current (default-to (empty-stats) (map-get? player-stats tx-sender)))
                (next-streak (+ (get current-streak current) u1))
                (next-best (if (> next-streak (get best-streak current)) next-streak (get best-streak current)))
              )
              (asserts! (is-eq expected (get commitment entry)) ERR_INVALID_REVEAL)
              (map-set entries { room-id: room-id, player: tx-sender } (merge entry { revealed: true, number: number }))
              (map-set rooms room-id (merge room { revealed-count: (+ (get revealed-count room) u1) }))
              (if (is-eq count u0) (map-set first-pickers { room-id: room-id, number: number } tx-sender) false)
              (map-set number-counts { room-id: room-id, number: number } (+ count u1))
              (map-set player-stats tx-sender (merge current {
                score: (+ (get score current) u5), reveals: (+ (get reveals current) u1),
                current-streak: next-streak, best-streak: next-best
              }))
              (print { event: "number-revealed", room-id: room-id, player: tx-sender, number: number })
              (ok true)
            )
          )
          ERR_NOT_COMMITTED)
      )
    ERR_ROOM_NOT_FOUND)
)

(define-public (finalize-room (room-id uint))
  (match (map-get? rooms room-id)
    room
      (begin
        (asserts! (>= stacks-block-time (get reveal-end-at room)) ERR_TOO_EARLY)
        (asserts! (not (get finalized room)) ERR_FINALIZED)
        (if (< (get revealed-count room) MIN_REVEALS)
          (begin
            (map-set rooms room-id (merge room { finalized: true, outcome: u3 }))
            (print { event: "room-finalized", room-id: room-id, outcome: u3,
              winner: none, winning-number: u0, revealed-count: (get revealed-count room) })
            (ok u3))
          (let ((winning-number (lowest-for-room room-id)))
            (if (is-eq winning-number u0)
              (begin
                (map-set rooms room-id (merge room { finalized: true, outcome: u2 }))
                (print { event: "room-finalized", room-id: room-id, outcome: u2,
                  winner: none, winning-number: u0, revealed-count: (get revealed-count room) })
                (ok u2))
              (match (map-get? first-pickers { room-id: room-id, number: winning-number }) winner
                (let ((current (default-to (empty-stats) (map-get? player-stats winner))))
                  (map-set rooms room-id (merge room {
                    finalized: true, outcome: u1, winner: (some winner), winning-number: winning-number
                  }))
                  (map-set player-stats winner (merge current {
                    score: (+ (get score current) u100), wins: (+ (get wins current) u1),
                    number-one-wins: (+ (get number-one-wins current) (if (is-eq winning-number u1) u1 u0))
                  }))
                  (print { event: "room-finalized", room-id: room-id, outcome: u1,
                    winner: (some winner), winning-number: winning-number, revealed-count: (get revealed-count room) })
                  (ok u1))
                ERR_ROOM_NOT_FOUND))))
      )
    ERR_ROOM_NOT_FOUND)
)

(define-read-only (get-total-rooms) (ok (var-get total-rooms)))
(define-read-only (get-room (room-id uint))
  (match (map-get? rooms room-id) room (ok room) ERR_ROOM_NOT_FOUND))
(define-read-only (get-entry (room-id uint) (player principal))
  (match (map-get? entries { room-id: room-id, player: player }) entry (ok entry) ERR_NOT_COMMITTED))
(define-read-only (get-participant (room-id uint) (index uint))
  (match (map-get? rooms room-id) room
    (begin
      (asserts! (< index (get committed-count room)) ERR_INDEX)
      (match (map-get? participants { room-id: room-id, index: index }) player (ok player) ERR_INDEX))
    ERR_ROOM_NOT_FOUND))
(define-read-only (get-number-count (room-id uint) (number uint))
  (match (map-get? rooms room-id) room
    (begin
      (asserts! (>= stacks-block-time (get reveal-end-at room)) ERR_REVEAL_STILL_OPEN)
      (asserts! (and (> number u0) (<= number MAX_NUMBER)) ERR_INVALID_NUMBER)
      (ok (default-to u0 (map-get? number-counts { room-id: room-id, number: number }))))
    ERR_ROOM_NOT_FOUND))
(define-read-only (get-player-stats (player principal))
  (let ((current (default-to (empty-stats) (map-get? player-stats player))))
    (match (map-get? last-played-room player) previous-id
      (match (map-get? rooms previous-id) previous
        (if (>= stacks-block-time (get reveal-end-at previous))
          (match (map-get? entries { room-id: previous-id, player: player }) entry
            (if (get revealed entry) (ok current) (ok (merge current { current-streak: u0 })))
            (ok current))
          (ok current))
        (ok current))
      (ok current))))
(define-read-only (get-created-count (player principal)) (ok (default-to u0 (map-get? created-counts player))))
(define-read-only (get-played-count (player principal)) (ok (default-to u0 (map-get? played-counts player))))
(define-read-only (get-created-id (player principal) (index uint))
  (match (map-get? created-ids { player: player, index: index }) id (ok id) ERR_INDEX))
(define-read-only (get-played-id (player principal) (index uint))
  (match (map-get? played-ids { player: player, index: index }) id (ok id) ERR_INDEX))
