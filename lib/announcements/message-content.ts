export type AnnouncementMessageImage = {
  src: string;
  href: string | null;
  alt: string;
};

export type AnnouncementMessageContent = {
  text: string;
  image: AnnouncementMessageImage | null;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isSafeUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (trimmedValue.startsWith("/")) {
    return true;
  }

  if (trimmedValue.startsWith("https://") || trimmedValue.startsWith("http://")) {
    return true;
  }

  return false;
}

function extractQuotedAttribute(tag: string, attributeName: string) {
  const match = tag.match(
    new RegExp(`${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"),
  );

  if (!match) {
    return null;
  }

  return (match[1] ?? match[2] ?? "").trim();
}

function parseAnchorImageSnippet(message: string) {
  const anchorWithImageMatch = message.match(
    /<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/i,
  );

  if (!anchorWithImageMatch) {
    return null;
  }

  const anchorTag = anchorWithImageMatch[0].match(/<a\b[^>]*>/i)?.[0] ?? "";
  const imageTag = anchorWithImageMatch[0].match(/<img\b[^>]*>/i)?.[0] ?? "";
  const href = extractQuotedAttribute(anchorTag, "href");
  const src = extractQuotedAttribute(imageTag, "src");
  const alt = extractQuotedAttribute(imageTag, "alt") || "Banner do aviso";

  if (!src || !isSafeUrl(src)) {
    return null;
  }

  if (href && !isSafeUrl(href)) {
    return null;
  }

  return {
    raw: anchorWithImageMatch[0],
    image: {
      src,
      href: href || null,
      alt,
    },
  };
}

function parseStandaloneImageSnippet(message: string) {
  const imageMatch = message.match(/<img\b[^>]*>/i);

  if (!imageMatch) {
    return null;
  }

  const imageTag = imageMatch[0];
  const src = extractQuotedAttribute(imageTag, "src");
  const alt = extractQuotedAttribute(imageTag, "alt") || "Banner do aviso";

  if (!src || !isSafeUrl(src)) {
    return null;
  }

  return {
    raw: imageTag,
    image: {
      src,
      href: null,
      alt,
    },
  };
}

export function parseAnnouncementMessageContent(
  rawMessage: string,
): AnnouncementMessageContent {
  const message = typeof rawMessage === "string" ? rawMessage : "";

  const anchorImage = parseAnchorImageSnippet(message);
  if (anchorImage) {
    return {
      image: anchorImage.image,
      text: normalizeWhitespace(message.replace(anchorImage.raw, "")),
    };
  }

  const standaloneImage = parseStandaloneImageSnippet(message);
  if (standaloneImage) {
    return {
      image: standaloneImage.image,
      text: normalizeWhitespace(message.replace(standaloneImage.raw, "")),
    };
  }

  return {
    image: null,
    text: normalizeWhitespace(message),
  };
}
