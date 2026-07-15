// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OddOneArena {
    uint8 public constant MAX_PLAYERS = 12;
    uint8 public constant MIN_REVEALS = 3;
    uint8 public constant MAX_NUMBER = 20;
    uint64 public constant COMMIT_DURATION = 20 minutes;
    uint64 public constant REVEAL_DURATION = 10 minutes;

    uint8 public constant OUTCOME_PENDING = 0;
    uint8 public constant OUTCOME_WINNER = 1;
    uint8 public constant OUTCOME_DRAW = 2;
    uint8 public constant OUTCOME_NO_CONTEST = 3;

    struct Room {
        uint256 id;
        address creator;
        bool listed;
        uint64 createdAt;
        uint64 commitEndAt;
        uint64 revealEndAt;
        uint8 committedCount;
        uint8 revealedCount;
        bool finalized;
        uint8 outcome;
        uint8 winningNumber;
        address winner;
    }

    struct Entry {
        bytes32 commitment;
        bool revealed;
        uint8 number;
    }

    struct PlayerStats {
        uint256 score;
        uint256 roomsPlayed;
        uint256 reveals;
        uint256 wins;
        uint256 numberOneWins;
        uint256 currentRevealStreak;
        uint256 bestRevealStreak;
    }

    error InvalidCommitment();
    error InvalidNumber();
    error RoomNotFound();
    error CommitClosed();
    error RevealNotOpen();
    error RevealClosed();
    error RevealStillOpen();
    error RoomFull();
    error AlreadyCommitted();
    error ActiveRoomExists();
    error NotCommitted();
    error AlreadyRevealed();
    error InvalidReveal();
    error TooEarlyToFinalize();
    error AlreadyFinalized();
    error IndexOutOfBounds();

    event RoomCreated(
        uint256 indexed roomId,
        address indexed creator,
        bool listed,
        uint64 commitEndAt,
        uint64 revealEndAt
    );
    event NumberCommitted(uint256 indexed roomId, address indexed player, uint8 playerIndex);
    event NumberRevealed(uint256 indexed roomId, address indexed player, uint8 number);
    event RoomFinalized(
        uint256 indexed roomId,
        uint8 outcome,
        address indexed winner,
        uint8 winningNumber,
        uint8 revealedCount
    );

    uint256 public totalRooms;
    mapping(uint256 => Room) private rooms;
    mapping(uint256 => mapping(address => Entry)) private entries;
    mapping(uint256 => mapping(uint8 => address)) private participants;
    mapping(uint256 => mapping(uint8 => uint8)) private numberCounts;
    mapping(uint256 => mapping(uint8 => address)) private firstPickers;

    mapping(address => PlayerStats) private stats;
    mapping(address => uint256) private lastPlayedRoom;
    mapping(address => uint256) private createdCounts;
    mapping(address => mapping(uint256 => uint256)) private createdIds;
    mapping(address => uint256) private playedCounts;
    mapping(address => mapping(uint256 => uint256)) private playedIds;

    function createRoom(bytes32 commitment, bool listed) external returns (uint256 roomId) {
        if (commitment == bytes32(0)) revert InvalidCommitment();
        _preparePlayer(msg.sender);

        roomId = ++totalRooms;
        uint64 createdAt = uint64(block.timestamp);
        uint64 commitEndAt = createdAt + COMMIT_DURATION;
        uint64 revealEndAt = commitEndAt + REVEAL_DURATION;

        rooms[roomId] = Room({
            id: roomId,
            creator: msg.sender,
            listed: listed,
            createdAt: createdAt,
            commitEndAt: commitEndAt,
            revealEndAt: revealEndAt,
            committedCount: 1,
            revealedCount: 0,
            finalized: false,
            outcome: OUTCOME_PENDING,
            winningNumber: 0,
            winner: address(0)
        });
        entries[roomId][msg.sender] = Entry(commitment, false, 0);
        participants[roomId][0] = msg.sender;
        _indexPlay(msg.sender, roomId);
        createdIds[msg.sender][createdCounts[msg.sender]++] = roomId;

        emit RoomCreated(roomId, msg.sender, listed, commitEndAt, revealEndAt);
        emit NumberCommitted(roomId, msg.sender, 0);
    }

    function commitNumber(uint256 roomId, bytes32 commitment) external {
        Room storage room = _room(roomId);
        if (block.timestamp >= room.commitEndAt) revert CommitClosed();
        if (room.committedCount >= MAX_PLAYERS) revert RoomFull();
        if (commitment == bytes32(0)) revert InvalidCommitment();
        if (entries[roomId][msg.sender].commitment != bytes32(0)) revert AlreadyCommitted();
        _preparePlayer(msg.sender);

        uint8 index = room.committedCount;
        entries[roomId][msg.sender] = Entry(commitment, false, 0);
        participants[roomId][index] = msg.sender;
        room.committedCount = index + 1;
        _indexPlay(msg.sender, roomId);

        emit NumberCommitted(roomId, msg.sender, index);
    }

    function revealNumber(uint256 roomId, uint8 number, bytes32 salt) external {
        Room storage room = _room(roomId);
        if (block.timestamp < room.commitEndAt) revert RevealNotOpen();
        if (block.timestamp >= room.revealEndAt) revert RevealClosed();
        if (number == 0 || number > MAX_NUMBER) revert InvalidNumber();

        Entry storage entry = entries[roomId][msg.sender];
        if (entry.commitment == bytes32(0)) revert NotCommitted();
        if (entry.revealed) revert AlreadyRevealed();
        uint256 commitmentRoomId = msg.sender == room.creator ? 0 : roomId;
        if (entry.commitment != computeCommitment(commitmentRoomId, msg.sender, number, salt)) revert InvalidReveal();

        entry.revealed = true;
        entry.number = number;
        room.revealedCount += 1;
        uint8 count = numberCounts[roomId][number];
        if (count == 0) firstPickers[roomId][number] = msg.sender;
        numberCounts[roomId][number] = count + 1;

        PlayerStats storage player = stats[msg.sender];
        player.score += 5;
        player.reveals += 1;
        player.currentRevealStreak += 1;
        if (player.currentRevealStreak > player.bestRevealStreak) {
            player.bestRevealStreak = player.currentRevealStreak;
        }

        emit NumberRevealed(roomId, msg.sender, number);
    }

    function finalizeRoom(uint256 roomId) external {
        Room storage room = _room(roomId);
        if (block.timestamp < room.revealEndAt) revert TooEarlyToFinalize();
        if (room.finalized) revert AlreadyFinalized();

        room.finalized = true;
        if (room.revealedCount < MIN_REVEALS) {
            room.outcome = OUTCOME_NO_CONTEST;
        } else {
            for (uint8 number = 1; number <= MAX_NUMBER; number++) {
                if (numberCounts[roomId][number] == 1) {
                    room.outcome = OUTCOME_WINNER;
                    room.winningNumber = number;
                    room.winner = firstPickers[roomId][number];
                    PlayerStats storage winnerStats = stats[room.winner];
                    winnerStats.score += 100;
                    winnerStats.wins += 1;
                    if (number == 1) winnerStats.numberOneWins += 1;
                    break;
                }
            }
            if (room.outcome == OUTCOME_PENDING) room.outcome = OUTCOME_DRAW;
        }

        emit RoomFinalized(roomId, room.outcome, room.winner, room.winningNumber, room.revealedCount);
    }

    function computeCommitment(
        uint256 roomId,
        address player,
        uint8 number,
        bytes32 salt
    ) public view returns (bytes32) {
        return keccak256(abi.encode(address(this), block.chainid, roomId, player, number, salt));
    }

    function getRoom(uint256 roomId) external view returns (Room memory) { return _roomView(roomId); }
    function getEntry(uint256 roomId, address player) external view returns (Entry memory) {
        _roomView(roomId);
        return entries[roomId][player];
    }
    function getParticipant(uint256 roomId, uint8 index) external view returns (address) {
        Room memory room = _roomView(roomId);
        if (index >= room.committedCount) revert IndexOutOfBounds();
        return participants[roomId][index];
    }
    function getNumberCount(uint256 roomId, uint8 number) external view returns (uint8) {
        Room memory room = _roomView(roomId);
        if (block.timestamp < room.revealEndAt) revert RevealStillOpen();
        if (number == 0 || number > MAX_NUMBER) revert InvalidNumber();
        return numberCounts[roomId][number];
    }
    function getPlayerStats(address player) external view returns (PlayerStats memory result) {
        result = stats[player];
        uint256 previousId = lastPlayedRoom[player];
        if (previousId != 0 && block.timestamp >= rooms[previousId].revealEndAt && !entries[previousId][player].revealed) {
            result.currentRevealStreak = 0;
        }
    }
    function getCreatedCount(address player) external view returns (uint256) { return createdCounts[player]; }
    function getPlayedCount(address player) external view returns (uint256) { return playedCounts[player]; }
    function getCreatedId(address player, uint256 index) external view returns (uint256) {
        if (index >= createdCounts[player]) revert IndexOutOfBounds();
        return createdIds[player][index];
    }
    function getPlayedId(address player, uint256 index) external view returns (uint256) {
        if (index >= playedCounts[player]) revert IndexOutOfBounds();
        return playedIds[player][index];
    }

    function _preparePlayer(address player) private {
        uint256 previousId = lastPlayedRoom[player];
        if (previousId != 0) {
            Room storage previous = rooms[previousId];
            if (block.timestamp < previous.revealEndAt) revert ActiveRoomExists();
            if (!entries[previousId][player].revealed) stats[player].currentRevealStreak = 0;
        }
    }

    function _indexPlay(address player, uint256 roomId) private {
        playedIds[player][playedCounts[player]++] = roomId;
        lastPlayedRoom[player] = roomId;
        stats[player].roomsPlayed += 1;
    }

    function _room(uint256 roomId) private view returns (Room storage room) {
        if (roomId == 0 || roomId > totalRooms) revert RoomNotFound();
        room = rooms[roomId];
    }
    function _roomView(uint256 roomId) private view returns (Room memory room) {
        if (roomId == 0 || roomId > totalRooms) revert RoomNotFound();
        room = rooms[roomId];
    }
}
