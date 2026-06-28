# Stopped Here — 2026-06-28

## Done
- NOKA-STORE live on Vercel (noka-store.vercel.app)
- Fixed Vercel build: `build:vercel` changed from `--external:./node_modules/*` to explicit npm externals — workspace packages `@workspace/db` and `@workspace/api-zod` bundled inline instead of external
- Deleted shipping banner text from `Home.tsx` and `Product.tsx`
- `pnpm-workspace.yaml` restored with `onlyBuiltDependencies: [esbuild]`
- `typescript` added to root `devDependencies`

## Next
- Add new content/feature tomorrow
