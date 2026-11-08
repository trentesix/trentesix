# Changesets

Every change a user of Trentesix would notice comes with a changeset: `pnpm changeset`, pick the
packages it touches and say whether it's a patch, minor or major. The five packages share one
version (`fixed` in config.json), so a release moves them together. Changesets writes no
changelog (`"changelog": false`).

Releasing: `pnpm changeset version` (bumps the versions), then `pnpm release` (builds, checks,
tests and publishes to npm).
