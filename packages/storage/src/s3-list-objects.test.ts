import { describe, expect, it } from "vitest";

import { parseListObjectsResponse } from "./s3-list-objects";

const listXml = ({
  contents,
  truncated,
}: {
  contents: string;
  truncated: boolean;
}) => `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>test-bucket</Name>
  <Prefix>images/</Prefix>
  <MaxKeys>2</MaxKeys>
  <IsTruncated>${truncated}</IsTruncated>
  ${contents}
  ${truncated ? "<NextContinuationToken>next+token/=</NextContinuationToken>" : ""}
</ListBucketResult>`;

const object = (key: string, size: number) => `<Contents>
    <Key>${key}</Key>
    <LastModified>2026-10-24T13:00:00.000Z</LastModified>
    <ETag>"abc"</ETag>
    <Size>${size}</Size>
    <StorageClass>STANDARD</StorageClass>
  </Contents>`;

describe(parseListObjectsResponse, () => {
  it("reads keys, sizes, and upload times", () => {
    const page = parseListObjectsResponse(
      listXml({
        contents:
          object("images/org-1/a.png", 2048) + object("images/org-1/b.png", 10),
        truncated: false,
      })
    );

    expect(page).toStrictEqual({
      cursor: undefined,
      objects: [
        {
          key: "images/org-1/a.png",
          size: 2048,
          uploadedAt: new Date("2026-10-24T13:00:00.000Z"),
        },
        {
          key: "images/org-1/b.png",
          size: 10,
          uploadedAt: new Date("2026-10-24T13:00:00.000Z"),
        },
      ],
    });
  });

  it("returns the continuation token only when the list is truncated", () => {
    const page = parseListObjectsResponse(
      listXml({ contents: object("images/org-1/a.png", 1), truncated: true })
    );

    expect(page.cursor).toBe("next+token/=");
  });

  it("decodes XML entities in keys", () => {
    const page = parseListObjectsResponse(
      listXml({
        contents: object("images/org-1/a&amp;b&#39;c&#x20;d.png", 1),
        truncated: false,
      })
    );

    expect(page.objects[0]?.key).toBe("images/org-1/a&b'c d.png");
  });

  it("returns an empty page for an empty prefix", () => {
    expect(
      parseListObjectsResponse(listXml({ contents: "", truncated: false }))
    ).toStrictEqual({ cursor: undefined, objects: [] });
  });
});
