# Contributing

## Workflow

1. Branch from `main`: `feat/<short-name>`, `fix/<short-name>` or `docs/<short-name>`.
2. Keep changes small and focused.
3. Open a pull request into `main` and describe what changed and why.
4. Squash and merge once reviewed.

## Commits

Use short, imperative messages, ideally [Conventional Commits](https://www.conventionalcommits.org/): `feat: add trip card`, `fix: correct deposit rounding`, `docs: update SEO plan`.

## Ground rules

- Follow the [design spec](docs/design-spec.md): use the design tokens, and keep copy minimal.
- Public pages follow the [SEO plan](docs/seo.md).
- Never commit secrets. Use `.env.local` and keep `.env.example` current.
- Enforce admin permissions on the server, not only in the UI.
- Do not ship placeholder content (names, prices, photos) to production.
