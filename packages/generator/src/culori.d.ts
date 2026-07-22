declare module "culori" {
  export interface OklchColor {
    c: number;
    h?: number;
    l: number;
    mode: "oklch";
  }

  export interface LrgbColor {
    b: number;
    g: number;
    mode: "lrgb";
    r: number;
  }

  export function converter(
    mode: "oklch"
  ): (color: string | object) => OklchColor | undefined;
  export function converter(
    mode: "lrgb"
  ): (color: string | object) => LrgbColor | undefined;
  export function parse(color: string): object | undefined;
  export function formatHex(color: string | object): string | undefined;
  export function formatRgb(color: string | object): string | undefined;
  export function formatHsl(color: string | object): string | undefined;
  export function displayable(color: object): boolean;
  export function wcagContrast(a: string | object, b: string | object): number;
}
