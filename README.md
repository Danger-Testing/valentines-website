# Link Bouquet

Create a floral collection of links, keep a local draft, and share a recipient view.

## Development

Install with `npm ci`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, then run `npm run dev`.

`npm run typecheck`, `npm run lint`, and `npm test` cover TypeScript, lint, and regression tests. Tests use Bun. The privacy test runs in a disposable embedded Postgres database and never connects to production. `npm run build` checks the production build.

## Browser verification with disposable data

Run `npm run test:fixtures` in one terminal. In another, start the app with:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:4110 NEXT_PUBLIC_SUPABASE_ANON_KEY=local-test-key npm run dev -- --port 3108
```

The test service supplies 145 public bouquets, supports saving and lookup, and keeps changes only in memory. Restart it to reset. A request to `http://127.0.0.1:4110/fail-next` makes its next request fail, for testing retry behavior. Never use these environment overrides for a deployment.

Verify adding a link, refreshing and resuming, removing and undoing, note paste, save/copy/preview/keep editing, missing links, gallery retry, loading a second page, tile navigation, and mobile flower controls. Production writes are unnecessary for these checks.

For mobile forms, check 390px and 320px widths, then reduce the viewport height to 420px and 300px to check the space available above a keyboard. Inputs should remain at least 16px, form content should scroll, and Back/Save should remain visible. Dialogs also follow `visualViewport` resize/scroll events for Safari keyboards. Desktop resizing does not emulate a real iOS keyboard; device checks should cover keyboard opening/closing, rotation, and intentional pinch zoom.

## Database privacy rollout

See [supabase/README.md](supabase/README.md) for the required deployment order and migration. Unlisted bouquets are available to anyone holding their full URL. Only opted-in bouquets should be enumerable in the gallery. The migration must be applied after the updated client and any other consumers are ready.

## Link previews

Preview routes accept public HTTP(S) pages only. DNS addresses are validated during the actual connection, every redirect is revalidated, requests time out after eight seconds, and HTML is capped at 512 KiB. Successful results are cached in a bounded in-process cache for five minutes. The Letterboxd route accepts only Letterboxd hosts.
