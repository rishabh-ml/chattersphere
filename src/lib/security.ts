import DOMPurify from "isomorphic-dompurify";

/**
 * Configuration for DOMPurify sanitization
 */
const sanitizeConfig = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  ALLOWED_ATTR: ["alt", "class", "href", "id", "src", "style", "target", "title"],
  ALLOW_DATA_ATTR: false,
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["script", "style", "iframe", "frame", "object", "embed"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, sanitizeConfig);
}

/**
 * Validates and sanitizes a URL
 */
export function sanitizeUrl(url: string): string {
  // Check if URL is valid
  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }

    return parsedUrl.toString();
  } catch (error) {
    // Invalid URL
    return "";
  }
}

/**
 * Sanitizes user input for use in database queries
 */
export function sanitizeInput(input: string): string {
  // Remove any potentially dangerous characters
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/[{}]/g, "") // Remove curly braces
    .replace(/[[\]]/g, "") // Remove square brackets
    .replace(/[()]/g, "") // Remove parentheses
    .replace(/[\\]/g, "") // Remove backslashes
    .trim();
}
