# Contract parity

| Behavior | Celo | Stacks | Shared result |
| --- | --- | --- | --- |
| Time source | `block.timestamp` | `stacks-block-time` | Unix seconds |
| Create and creator commit | `createRoom` | `create-room` | Room starts immediately |
| Join | `commitNumber` | `commit-number` | One immutable commitment |
| Reveal | `revealNumber` | `reveal-number` | 1–20 and matching salt |
| Finalize | `finalizeRoom` | `finalize-room` | Lowest unique or draw/no-contest |
| Capacity | Fixed 12 | Fixed 12 | `ROOM_FULL` |
| Minimum reveals | Fixed 3 | Fixed 3 | No-contest below minimum |
| Reveal points | 5 | 5 | Added on reveal |
| Winner points | 100 | 100 | Added on finalization |
| Indexes | Created/played mappings | Created/played maps | Direct profile pagination |
| Privileges | None | None | No owner/admin/upgrade |

Stable application errors normalize Solidity custom error names and Clarity error codes `u400`–`u415`. Fixed commitment vectors must prove both local codecs match their contract before deployment.
