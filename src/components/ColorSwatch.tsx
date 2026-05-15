interface Props {
  color: string;
  onChange: (c: string) => void;
}

export function ColorSwatch({ color, onChange }: Props) {
  return (
    <label className="color-swatch" title="Choose color" style={{ background: color }}>
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        aria-label="Choose color"
      />
    </label>
  );
}
