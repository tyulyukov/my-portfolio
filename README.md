# My gorgeous portfolio ✨

> Was vibecoded in 2 days with no experience in React at all

https://tyulyukov.com - Check this out

## Rebuild the 3D avatar

The model and poster are generated with Blender 5.2.1. With `blender` on your PATH, run:

```sh
npm run build:avatar
```

For the standard macOS app installation:

```sh
PATH="/Applications/Blender.app/Contents/MacOS:$PATH" npm run build:avatar
```

This rebuilds `public/avatar.glb` and `public/avatar-3d.webp` from `scripts/build-avatar.py`.

When replacing the model, update the version keys in `src/data/avatar.ts`. Both portrait fallbacks use that file.

The revised model follows the original emoji and an [Image Gen character reference](scripts/reference/avatar-concept.png). It keeps the swept blond hair, glasses, AirPods, and silver laptop with an inlaid Apple silhouette. The reference is a design asset; the website renders the Blender geometry.
