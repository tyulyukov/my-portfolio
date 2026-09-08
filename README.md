# My gorgeous portfolio ✨

> Was vibecoded in 2 days with no experience in React at all

https://tyulyukov.com - Check this out

## Portfolio artwork

The hero uses `public/portrait.webp`, exported from the supplied portrait. The desktop button opens mTOS directly.

The three static illustrations in `public/illustrations/` share a Blender scene at `assets/portfolio-objects/portfolio-objects.blend`. Source PNGs are saved in its `renders/` directory.

To rebuild the illustrations with Blender 5.2.1:

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/build-portfolio-objects.py
```

On macOS, the Blender executable is also available at `/Applications/Blender.app/Contents/MacOS/Blender`.

Export the 480-pixel PNGs as transparent WebP files:

```sh
for asset_name in ai-processor code-terminal server-stack; do
  cwebp -q 88 -m 6 -alpha_q 100 "assets/portfolio-objects/renders/$asset_name.png" -o "public/illustrations/$asset_name.webp"
done
```

The saved scene shows the processor. Enable the corresponding collection to inspect the terminal or server stack.
