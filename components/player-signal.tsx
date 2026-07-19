import { shortAddress } from "@/lib/game";

function hash(address: string) { return [...address].reduce((value, char) => ((value << 5) - value + char.charCodeAt(0)) | 0, 7) >>> 0; }
export function PlayerSignal({ address, size = 42 }: { address: string; size?: number }) {
  const seed = hash(address); const bars = Array.from({ length: 5 }, (_, i) => 5 + ((seed >> (i * 3)) & 15));
  return <svg className="player-signal" width={size} height={size} viewBox="0 0 42 42" role="img" aria-label={`Player signal for ${shortAddress(address)}`}>
    <circle cx="21" cy="21" r="20" fill={`hsl(${seed % 360} 72% 18%)`} />
    {bars.map((height, i) => <rect key={i} x={8 + i * 6} y={21 - height / 2} width="3" height={height} rx="1.5" fill={i === seed % 5 ? "#D8FF3E" : "#E8F5FF"} />)}
  </svg>;
}
