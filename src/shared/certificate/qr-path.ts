/*
 * The certificate PDF's QR bridge (Milestone 15, Req 6).
 *
 * `certificateQrSvg` (qr.ts) returns the `qrcode` library's SVG string: a
 * single `<svg viewBox="0 0 N N">` with one STROKED `<path stroke="#colour"
 * d="M0 0.5h7m2 0h1…">` in which every dark run of modules is a horizontal
 * line one unit thick. The PDF renderer draws vector paths, so this turns
 * that string into one FILLED path (each run becomes a 1-unit-high rectangle
 * with the same geometry) plus the viewBox size and the dark colour.
 *
 * Pure and strict on purpose: it understands only the commands the library
 * emits (M m h H v V z Z). Anything else means the library's output changed
 * and a QR that might not scan must never be printed — so it throws.
 */

export type QrVector = {
  /** Side of the square viewBox, in modules. */
  size: number;
  /** Dark colour, as written in the SVG. */
  color: string;
  /** One filled path covering every dark module run. */
  d: string;
};

const num = (n: number) => String(Math.round(n * 1000) / 1000);

export function qrSvgToPath(svg: string, options: { bleed?: number } = {}): QrVector {
  const bleed = options.bleed ?? 0;

  const viewBox = /viewBox\s*=\s*"\s*0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*"/.exec(svg);
  if (!viewBox || viewBox[1] !== viewBox[2]) {
    throw new Error("qrSvgToPath: expected a square viewBox starting at 0 0");
  }
  const size = Number(viewBox[1]);

  // The dark modules: the <path> elements that carry a `stroke` (a background
  // path, if the library ever emits one, is `fill`-only and is ignored).
  const paths = [...svg.matchAll(/<path\b([^>]*?)\/?>/g)]
    .map((m) => m[1] ?? "")
    .map((attrs) => ({
      stroke: /\bstroke\s*=\s*"([^"]+)"/.exec(attrs)?.[1],
      d: /\bd\s*=\s*"([^"]+)"/.exec(attrs)?.[1],
    }))
    .filter((p): p is { stroke: string; d: string } => Boolean(p.stroke && p.d));
  if (paths.length === 0) throw new Error("qrSvgToPath: no stroked path found");

  const out: string[] = [];
  for (const path of paths) {
    let x = 0;
    let y = 0;
    const commands = [...path.d.matchAll(/([MmHhVvZz])([^MmHhVvZz]*)/g)];
    // Guard: every character of `d` must belong to a supported command.
    if (path.d.replace(/([MmHhVvZz])([^MmHhVvZz]*)/g, "").trim() !== "") throw new Error("qrSvgToPath: unsupported path data");
    for (const [, cmd, rest] of commands) {
      const args = (rest ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (args.some((n) => !Number.isFinite(n))) throw new Error("qrSvgToPath: malformed number in path data");
      switch (cmd) {
        case "M":
        case "m": {
          if (args.length !== 2) throw new Error("qrSvgToPath: unsupported move");
          x = cmd === "M" ? args[0]! : x + args[0]!;
          y = cmd === "M" ? args[1]! : y + args[1]!;
          break;
        }
        case "h":
        case "H": {
          if (args.length !== 1) throw new Error("qrSvgToPath: unsupported horizontal run");
          const to = cmd === "H" ? args[0]! : x + args[0]!;
          const x0 = Math.min(x, to);
          const w = Math.abs(to - x);
          out.push(`M${num(x0 - bleed)} ${num(y - 0.5 - bleed)}h${num(w + 2 * bleed)}v${num(1 + 2 * bleed)}h${num(-(w + 2 * bleed))}z`);
          x = to;
          break;
        }
        case "v":
        case "V": {
          if (args.length !== 1) throw new Error("qrSvgToPath: unsupported vertical run");
          const to = cmd === "V" ? args[0]! : y + args[0]!;
          const y0 = Math.min(y, to);
          const h = Math.abs(to - y);
          out.push(`M${num(x - 0.5 - bleed)} ${num(y0 - bleed)}h${num(1 + 2 * bleed)}v${num(h + 2 * bleed)}h${num(-(1 + 2 * bleed))}z`);
          y = to;
          break;
        }
        default:
          // z / Z: nothing to draw for a stroked open path.
          break;
      }
    }
  }
  if (out.length === 0) throw new Error("qrSvgToPath: the QR path has no dark modules");
  return { size, color: paths[0]!.stroke, d: out.join("") };
}
