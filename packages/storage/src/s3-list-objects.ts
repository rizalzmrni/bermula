import type { ObjectPage } from "./object-storage";

const CONTENTS_PATTERN = /<Contents>(?<body>[\s\S]*?)<\/Contents>/gu;
const TAG_PATTERNS = {
  continuationToken:
    /<NextContinuationToken>(?<value>[\s\S]*?)<\/NextContinuationToken>/u,
  isTruncated: /<IsTruncated>(?<value>[\s\S]*?)<\/IsTruncated>/u,
  key: /<Key>(?<value>[\s\S]*?)<\/Key>/u,
  lastModified: /<LastModified>(?<value>[\s\S]*?)<\/LastModified>/u,
  size: /<Size>(?<value>[\s\S]*?)<\/Size>/u,
} as const;
const XML_ENTITY_PATTERN =
  /&(?<entity>amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/giu;
const XML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"',
};
const HEX_RADIX = 16;
const DECIMAL_RADIX = 10;

const decodeEntity = (entity: string) => {
  if (entity.startsWith("#x") || entity.startsWith("#X")) {
    return String.fromCodePoint(Number.parseInt(entity.slice(2), HEX_RADIX));
  }
  if (entity.startsWith("#")) {
    return String.fromCodePoint(
      Number.parseInt(entity.slice(1), DECIMAL_RADIX)
    );
  }
  return XML_ENTITIES[entity] ?? `&${entity};`;
};

const decodeXml = (text: string) =>
  text.replaceAll(XML_ENTITY_PATTERN, (_match, entity: string) =>
    decodeEntity(entity)
  );

const readTag = (xml: string, pattern: RegExp) => {
  const value = pattern.exec(xml)?.groups?.value;
  return value === undefined ? undefined : decodeXml(value);
};

/**
 * Mengurai respons S3 `ListObjectsV2`. Workers tidak punya `DOMParser`, dan
 * bentuk XML-nya datar & tetap, jadi cukup dibaca per tag.
 */
export const parseListObjectsResponse = (xml: string): ObjectPage => {
  const objects = [...xml.matchAll(CONTENTS_PATTERN)].map((match) => {
    const body = match.groups?.body ?? "";
    const key = readTag(body, TAG_PATTERNS.key);
    const lastModified = readTag(body, TAG_PATTERNS.lastModified);
    if (key === undefined || lastModified === undefined) {
      throw new Error(
        "R2 list response has an object without Key/LastModified"
      );
    }
    return {
      key,
      size: Number(readTag(body, TAG_PATTERNS.size) ?? 0),
      uploadedAt: new Date(lastModified),
    };
  });
  const isTruncated = readTag(xml, TAG_PATTERNS.isTruncated) === "true";

  return {
    cursor: isTruncated
      ? readTag(xml, TAG_PATTERNS.continuationToken)
      : undefined,
    objects,
  };
};
