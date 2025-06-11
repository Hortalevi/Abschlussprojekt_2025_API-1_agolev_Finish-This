import './CountdownBar.css';

interface Props {
  secondsLeft: number;
  totalSeconds: number;
}

export default function CountdownBar({ secondsLeft, totalSeconds }: Props) {
  const percentage = (secondsLeft / totalSeconds) * 100;

  return (
    <div className="bar-container">
      <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
    </div>
  );
}
