# Dev preview workflow

## Branches

- `main`: stable production version deployed by GitHub Pages.
- `dev`: all UI, feature, and bug-fix work awaiting user approval.

## Change cycle

1. Work only on `dev`.
2. Limit each batch to 2–4 related items.
3. Validate and commit the batch.
4. Push `dev` without merging.
5. Ask the user to test the dev preview.
6. Merge to `main` only after explicit approval.

## URLs

- Production: <https://komay0818-coder.github.io/world/>
- Dev preview: <https://raw.githack.com/komay0818-coder/world/dev/index.html>

The dev preview reads directly from the `dev` branch and does not trigger the
GitHub Pages production deployment.
