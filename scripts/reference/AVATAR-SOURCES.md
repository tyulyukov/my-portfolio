# Avatar source assets

The Blender recipe uses a fitted adult head and hair mesh. The body, glasses, hands, watch, and MacBook are modeled in `scripts/build-avatar.py`. Original portrait photographs are not included.

`adult-head.json` contains 4,353 vertices extracted from the body group of the MakeHuman `hm08` base mesh. Its metadata records the baked shape targets and expression adjustments. The three regional young-male targets are blended equally to form a neutral starting head, not to assign an ethnicity to the owner. The Blender recipe applies the final portrait proportions, nose, smile, eyelids, and skin colors.

The base mesh and targets come from MakeHuman commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`:

- [Base mesh](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/3dobjs/base.obj)
- [Asset license](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md)

`swept-hair.json` derives from `hair/short03` in the [MakeHuman CC0 system assets pack](https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip), downloaded September 7, 2026. The OBJ, MHCLO, and material headers explicitly record their September 2020 release under CC0. The credited asset authors are Data Collection AB, Joel Palmius, and Jonas Hauquier.

The hair was fitted to the morphed head with the MHCLO vertex references. Each fitted vertex is the weighted sum of three head vertices plus its axis-scaled offset. Each axis scale is the distance between the MHCLO's two reference vertices divided by its recorded denominator. UV coordinates and face indices retain the source OBJ layout. The Blender recipe shortens the fringe and nape.

`hair-alpha.png` preserves the original short03 diffuse texture and supplies its alpha channel. `swept-hair.png` is an Image Gen recoloring of that texture to ash blond. The recipe uses the generated color with the original alpha and embeds the combined texture in the GLB. `avatar-concept.png` is illustrative concept art, not a mesh reconstruction or a guarantee of exact likeness.

All required geometry and textures are checked in. Rebuilding the model does not require MakeHuman, downloads, an API key, or the private reference photos.

The downloaded system archive has SHA-256 `b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107`. The short03 OBJ and MHCLO both contain this header:

> This asset was explicitly released as CC0 in september 2020. The license
> text for CC0 can be found in the root of this repository.
