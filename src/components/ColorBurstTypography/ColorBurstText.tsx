interface ColorBurstTextProps {
  accessibleText?: string;
  children: string;
}

// One aria-hidden wrapper and a short global class per character: this runs
// for every character on the page, and the markup is duplicated in the RSC
// payload, so bytes here count roughly 2x.
const ColorBurstText = ({ accessibleText, children }: ColorBurstTextProps) => (
  <span>
    <span className="visuallyHidden">{accessibleText ?? children}</span>
    <span aria-hidden="true">
      {Array.from(children).map((character, index) =>
        character === ' ' ? (
          ' '
        ) : (
          <span className="cbc" key={`${character}-${index}`}>
            {character}
          </span>
        ),
      )}
    </span>
  </span>
);

export default ColorBurstText;
