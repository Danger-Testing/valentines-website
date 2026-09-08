import { describe, expect, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

describe("bouquet privacy migration", () => {
  test("restricts listing while preserving bearer links and anonymous saves", async () => {
    const db = new PGlite();
    try {
      await db.exec("create role anon; create role authenticated;");
      const sql = readFileSync(
        new URL(
          "../supabase/migrations/20260908140857_bouquet_sharing_privacy.sql",
          import.meta.url,
        ),
        "utf8",
      );
      await db.exec(sql);
      await db.exec(sql); // Migration remains safe on an already-updated schema.
      await db.exec(
        `insert into public.bouquets (slug, is_gallery, note) values ('public-test', true, 'hello'), ('unlisted-test', false, 'personal note'); set role anon;`,
      );
      const listed = await db.query<{ slug: string }>(
        "select slug from public.bouquets",
      );
      expect(listed.rows).toEqual([{ slug: "public-test" }]);
      const privateQuery = await db.query(
        "select slug from public.bouquets where slug = 'unlisted-test'",
      );
      expect(privateQuery.rows).toEqual([]);
      const shared = await db.query<{ bouquet: { note: string } }>(
        "select public.get_bouquet_by_slug('unlisted-test') as bouquet",
      );
      expect(shared.rows[0].bouquet.note).toBe("personal note");
      const wildcard = await db.query<{ bouquet: unknown }>(
        "select public.get_bouquet_by_slug('%') as bouquet",
      );
      expect(wildcard.rows[0].bouquet).toBe(null);
      await db.exec(
        "insert into public.bouquets (slug, items, is_gallery) values ('new-save', '[]', false)",
      );
      const saved = await db.query<{ bouquet: unknown }>(
        "select public.get_bouquet_by_slug('new-save') as bouquet",
      );
      expect(saved.rows[0].bouquet).not.toBe(null);
      await expect(
        db.exec("delete from public.bouquets where slug = 'public-test'"),
      ).rejects.toThrow();
      await expect(
        db.exec(
          "update public.bouquets set note = 'changed' where slug = 'public-test'",
        ),
      ).rejects.toThrow();
      await expect(
        db.exec(
          "insert into public.bouquets (slug, items) values ('invalid', '{}')",
        ),
      ).rejects.toThrow();
      await db.exec("reset role; set role authenticated;");
      expect((await db.query("select slug from public.bouquets")).rows).toEqual(
        [{ slug: "public-test" }],
      );
      expect(
        (
          await db.query(
            "select public.get_bouquet_by_slug('unlisted-test') as bouquet",
          )
        ).rows[0],
      ).toBeTruthy();
    } finally {
      await db.close();
    }
  }, 30000);
});
