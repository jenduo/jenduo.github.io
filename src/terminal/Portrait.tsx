/**
 * A real photograph, tinted into the palette.
 *
 * Deliberately not ASCII art: at terminal resolution a face maps almost entirely
 * to midtone characters of similar visual weight, so it comes out as noise. A
 * real image is recognisable, and the duotone treatment in terminal.css is what
 * keeps it looking like part of the terminal rather than a snapshot pasted on.
 */
export function Portrait({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="portrait">
      <img className="portrait-img" src={src} alt={alt} width={360} height={430} />
    </div>
  )
}
