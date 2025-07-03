function getLuminance(r: number, g: number, b: number): number {
  // Normalize the RGB values to the range 0-1
  r /= 255;
  g /= 255;
  b /= 255;

  // Apply the gamma correction
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate the luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastTextColor(hexcolor: string): "text-[rgb(0,0,0,65%)]" | "text-[rgb(255,255,255,90%)]" {
  return isLightColor(hexcolor) ? "text-[rgb(0,0,0,65%)]" : "text-[rgb(255,255,255,90%)]";
}

export function isLightColor(hexcolor: string): boolean {
  try {
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const luminance = getLuminance(r, g, b);

    // If luminance is greater than 0.5, the color is considered light
    return luminance > 0.5;
  } catch (error) {
    console.error("Error calculating isLightColor:", error);
    return false;
  }
}
