# Game rules

## Constants

- Numbers: 1–20
- Capacity: 12 commitments
- Minimum: 3 valid reveals
- Commit phase: 1,200 seconds
- Reveal phase: 600 seconds
- Valid reveal: 5 points
- Winner: additional 100 points

Creation enters the creator immediately. Each wallet can enter only one room whose reveal window has not ended. Capacity never changes the clock.

Commit is allowed strictly before `commitEndAt`. Reveal is allowed from `commitEndAt` inclusive until `revealEndAt` exclusive. Finalization begins at `revealEndAt`.

The creator commitment uses room domain `0`, which avoids guessing a future sequential room ID during concurrent creation. Every joining commitment uses its actual room ID. Both include contract/network domain, player, number, and a random 32-byte salt.

After reveal, finalization scans 1 through 20 and selects the first count equal to one. Fewer than three reveals is no-contest. If every revealed number is duplicated, the outcome is a draw.

Unlisted removes a room from ordinary application discovery. It is not privacy or access control: wallet addresses, commitments, reveals, timestamps, and results still remain public onchain.
