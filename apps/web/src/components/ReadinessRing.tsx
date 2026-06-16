type ReadinessRingProps = {
  score: number;
  size?: "large" | "small";
};

export function ReadinessRing({
  score,
  size = "large"
}: ReadinessRingProps) {
  return (
    <div
      className={`readiness-ring ${size}`}
      style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}
    >
      <div className="readiness-ring-inner">
        <strong>{score}</strong>
        <span>из 100</span>
      </div>
    </div>
  );
}
