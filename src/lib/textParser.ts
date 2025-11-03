/**
 * Parse GW2 text markup and convert to HTML
 * Handles tags like <c=@abilitytype>, <c=@reminder>, etc.
 */

const COLOR_MAP: Record<string, string> = {
  '@abilitytype': 'text-blue-400',
  '@reminder': 'text-gray-400 italic',
  '@warning': 'text-red-400',
  '@flavor': 'text-purple-400 italic',
  '@skill': 'text-yellow-400',
};

export function parseGW2Text(text: string): string {
  if (!text) return '';

  // Replace <c=@type>text</c> with styled spans
  let parsed = text.replace(
    /<c=@(\w+)>(.*?)<\/c>/gi,
    (_match, type, content) => {
      const colorClass = COLOR_MAP[`@${type.toLowerCase()}`] || 'text-gray-300';
      return `<span class="${colorClass}">${content}</span>`;
    }
  );

  // Handle line breaks
  parsed = parsed.replace(/\\n/g, '<br>');
  parsed = parsed.replace(/\n/g, '<br>');

  return parsed;
}

/**
 * Strip all markup and return plain text
 */
export function stripGW2Markup(text: string): string {
  if (!text) return '';

  let cleaned = text.replace(/<c=@\w+>(.*?)<\/c>/gi, '$1');
  cleaned = cleaned.replace(/\\n/g, ' ');
  cleaned = cleaned.replace(/\n/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}
