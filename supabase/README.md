# Bouquet sharing privacy rollout

The updated application was deployed on September 8, 2026 (Vercel deployment `dpl_46rfQsNzUPKf8p7PhHeDdiRhaEf2`). The live database's SELECT policy still uses `true`, including for bouquets excluded from the gallery. This migration has not been applied: automatic approval review requires explicit approval for the production access-policy change and its compatibility impact.

1. Deploy this application version. It calls `get_bouquet_by_slug` and falls back to the existing exact-slug SELECT only when the new RPC is absent. Update any other consumers that read unlisted bouquets directly to call the RPC as well.
2. Apply `migrations/20260908140857_bouquet_sharing_privacy.sql` using the normal production migration workflow.
3. Verify a known unlisted link opens through the RPC, a gallery query returns only opted-in rows, saving succeeds, and metadata previews still load. Run database security advisors.

The migration exposes only opted-in bouquets to listing queries. Unlisted bouquets remain accessible to anyone holding the complete share URL; this is not account-based private storage. New links contain a random 128-bit suffix. Existing links retain their original slugs and continue to work. The private helper schema must not be added to Supabase's exposed API schemas.

No rows are deleted. Avoid rolling back to an older application after the policy migration because its direct reads cannot open unlisted bouquets. The local database tests verify gallery filtering, exact-slug access, anonymous insertion, and denied updates/deletes using disposable data.
