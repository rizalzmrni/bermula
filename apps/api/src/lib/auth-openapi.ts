import type { Auth } from "@bermula/auth/server";
import type { OpenAPIHono } from "@hono/zod-openapi";

type OpenAPIDocument = ReturnType<OpenAPIHono["getOpenAPI31Document"]>;
type SchemaObject = NonNullable<
  NonNullable<OpenAPIDocument["components"]>["schemas"]
>[string];
export type AuthOpenAPIDocument = Awaited<
  ReturnType<Auth["api"]["generateOpenAPISchema"]>
>;

/** Prefix handler better-auth di `src/index.ts`; path dari generator relatif terhadapnya. */
export const AUTH_BASE_PATH = "/api/auth";

const AUTH_TAG = "Auth";
// Model better-auth (`User`, `Account`, ...) bisa bentrok dengan skema API
// sendiri (mis. `Account` di `/api/me`), jadi semuanya diberi prefix.
const AUTH_SCHEMA_PREFIX = "Auth";
const SCHEMA_REF_PATTERN = /"#\/components\/schemas\/(?<name>[^"]+)"/gu;
// Sebagian endpoint auth publik (sign-in, sign-up), sebagian butuh sesi:
// `{}` menandai cookie sesi sebagai opsional.
const OPTIONAL_SESSION_SECURITY = [{}, { sessionCookie: [] }];

const toAuthTag = (tag: string) =>
  tag === "Default" ? AUTH_TAG : `${AUTH_TAG}: ${tag}`;

const prefixSchemaRefs = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value).replaceAll(
      SCHEMA_REF_PATTERN,
      `"#/components/schemas/${AUTH_SCHEMA_PREFIX}$<name>"`
    )
  );

type AuthPathItem = AuthOpenAPIDocument["paths"][string];

const toDocumentedPathItem = (item: AuthPathItem) =>
  Object.fromEntries(
    Object.entries(item).map(([method, operation]) => [
      method,
      {
        ...operation,
        // Generator selalu menulis `bearerAuth`, padahal api ini memakai cookie sesi.
        security: OPTIONAL_SESSION_SECURITY,
        tags: (operation?.tags ?? ["Default"]).map(toAuthTag),
      },
    ])
  );

/**
 * Menggabungkan skema better-auth ke dokumen OpenAPI api: path diberi prefix
 * `/api/auth`, tag dikelompokkan di bawah "Auth", dan model diberi prefix
 * `Auth` (berikut semua `$ref`-nya).
 */
export const mergeAuthDocument = (
  document: OpenAPIDocument,
  auth: AuthOpenAPIDocument
): OpenAPIDocument => {
  const { paths, schemas } = prefixSchemaRefs({
    paths: auth.paths,
    schemas: auth.components.schemas,
  });

  const authPaths = Object.fromEntries(
    Object.entries(paths).map(([path, item]) => [
      `${AUTH_BASE_PATH}${path}`,
      toDocumentedPathItem(item),
    ])
  );
  const authSchemas = Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [
      `${AUTH_SCHEMA_PREFIX}${name}`,
      // Tipe better-auth menulis kolom tanggal sebagai `type: "date"`, padahal
      // generatornya mengeluarkan `type: "string"` + `format: "date-time"`.
      schema as SchemaObject,
    ])
  );

  return {
    ...document,
    components: {
      ...document.components,
      schemas: { ...document.components?.schemas, ...authSchemas },
    },
    paths: { ...document.paths, ...authPaths },
  };
};
