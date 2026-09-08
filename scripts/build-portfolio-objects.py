"""Build and render the three transparent portfolio illustrations.

Run with Blender 5.2+: Blender --background --factory-startup --python scripts/build-portfolio-objects.py
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "portfolio-objects"
PNG = OUT / "renders"
WEBP = ROOT / "public" / "illustrations"

VIOLET = (0.396, 0.255, 0.956, 1)
VIOLET_LIGHT = (0.651, 0.448, 1.0, 1)
CHARCOAL = (0.009, 0.008, 0.015, 1)
CHARCOAL_LITE = (0.037, 0.031, 0.06, 1)
SILVER = (0.72, 0.72, 0.8, 1)


def material(name, color, metallic=0.0, roughness=0.38, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = emission
    return mat


MAT = {}


def cube(name, loc, scale, mat, bevel=0.08, collection=None, rotation=None):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    if rotation:
        ob.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = ob.modifiers.new("Precision rounded edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    ob.data.materials.append(MAT[mat])
    if collection:
        for c in list(ob.users_collection):
            c.objects.unlink(ob)
        collection.objects.link(ob)
    return ob


def cylinder(name, loc, radius, depth, mat, collection, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=loc, rotation=rotation)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(MAT[mat])
    bevel = ob.modifiers.new("Soft edge", "BEVEL")
    bevel.width = 0.045
    bevel.segments = 3
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    collection.objects.link(ob)
    return ob


def collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def ai_processor(col):
    cube("Processor base", (0, 0, -0.18), (1.34, 1.34, 0.30), "charcoal", 0.16, col)
    cube("Processor silver plate", (0, 0, 0.15), (1.10, 1.10, 0.13), "silver", 0.12, col)
    cube("Processor violet core", (0, 0, 0.37), (0.84, 0.84, 0.16), "violet", 0.14, col)
    cube("Processor dark cap", (0, 0, 0.55), (0.61, 0.61, 0.11), "charcoal_lite", 0.10, col)
    for x in (-1.02, -0.68, -0.34, 0.0, 0.34, 0.68, 1.02):
        cube("Pin north", (x, -1.48, -0.04), (0.10, 0.30, 0.12), "silver", 0.05, col)
        cube("Pin south", (x, 1.48, -0.04), (0.10, 0.30, 0.12), "silver", 0.05, col)
    for y in (-1.02, -0.68, -0.34, 0.0, 0.34, 0.68, 1.02):
        cube("Pin west", (-1.48, y, -0.04), (0.30, 0.10, 0.12), "silver", 0.05, col)
        cube("Pin east", (1.48, y, -0.04), (0.30, 0.10, 0.12), "silver", 0.05, col)
    cylinder("Core lens", (0, 0, 0.70), 0.28, 0.09, "violet_light", col)


def terminal(col):
    cube("Terminal housing", (0, 0, 0.40), (1.45, 0.25, 1.05), "charcoal", 0.18, col)
    cube("Terminal bezel", (0, -0.285, 0.44), (1.20, 0.06, 0.80), "silver", 0.08, col)
    cube("Terminal screen", (0, -0.36, 0.44), (1.08, 0.035, 0.69), "charcoal_lite", 0.06, col)
    for sign in (-1, 1):
        x = sign * 0.63
        cube("Code chevron", (x, -0.42, 0.52), (0.042, 0.026, 0.22), "violet", 0.025, col, (0, -sign * 0.86, 0))
        cube("Code chevron", (x, -0.42, 0.20), (0.042, 0.026, 0.22), "violet", 0.025, col, (0, sign * 0.86, 0))
    cube("Terminal neck", (0, 0.05, -0.82), (0.18, 0.20, 0.34), "silver", 0.08, col)
    cube("Terminal foot", (0, 0.02, -1.17), (0.85, 0.52, 0.13), "charcoal", 0.12, col)
    cube("Foot accent", (0, -0.45, -1.05), (0.45, 0.035, 0.035), "violet", 0.025, col)


def server_stack(col):
    for z in (-0.85, 0.0, 0.85):
        cube("Server module", (0, 0, z), (1.35, 0.52, 0.34), "charcoal", 0.15, col)
        cube("Server faceplate", (0, -0.56, z), (1.13, 0.045, 0.20), "silver", 0.06, col)
        cube("Status strip", (-0.60, -0.62, z), (0.08, 0.02, 0.13), "violet", 0.02, col)
        for x in (-0.20, 0.08, 0.36):
            cube("Server port", (x, -0.62, z), (0.075, 0.02, 0.07), "charcoal_lite", 0.02, col)
        cube("Module edge light", (0.92, -0.62, z), (0.08, 0.02, 0.08), "violet_light", 0.03, col)
    cube("Stack side rail", (-1.28, 0.0, 0), (0.055, 0.48, 1.34), "violet", 0.04, col)


def point_camera(camera, target=(0, 0, 0)):
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat('-Z', 'Y').to_euler()


def main():
    for path in (OUT, PNG, WEBP):
        path.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    MAT.update({
        "violet": material("Violet", VIOLET, metallic=0.28, roughness=0.27, emission=0.10),
        "violet_light": material("Violet light", VIOLET_LIGHT, metallic=0.20, roughness=0.23, emission=0.38),
        "charcoal": material("Charcoal", CHARCOAL, metallic=0.52, roughness=0.29),
        "charcoal_lite": material("Charcoal light", CHARCOAL_LITE, metallic=0.30, roughness=0.34),
        "silver": material("Silver", SILVER, metallic=0.78, roughness=0.22),
    })
    items = [("ai-processor", ai_processor), ("code-terminal", terminal), ("server-stack", server_stack)]
    cols = []
    for name, builder in items:
        col = collection(name)
        builder(col)
        cols.append((name, col))
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 480
    scene.render.resolution_y = 480
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    scene.view_settings.look = 'AgX - Medium High Contrast'
    world = bpy.data.worlds.new("Transparent studio") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.color = (0.0, 0.0, 0.0)
    bpy.ops.object.camera_add(location=(5.6, -7.2, 5.2))
    camera = bpy.context.object
    camera.name = "Shared orthographic camera"
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 4.65
    point_camera(camera, (0, 0, 0))
    scene.camera = camera
    def light(name, loc, energy, size, color):
        bpy.ops.object.light_add(type='AREA', location=loc)
        ob = bpy.context.object
        ob.name = name
        ob.data.energy = energy
        ob.data.shape = 'DISK'
        ob.data.size = size
        ob.data.color = color
        point_camera(ob)
    light("Key softbox", (-4.0, -4.5, 6.5), 900, 5.5, (0.86, 0.82, 1.0))
    light("Violet rim", (4.0, 2.0, 4.5), 620, 4.0, (0.55, 0.35, 1.0))
    light("Front fill", (1.0, -5.0, 1.0), 300, 3.0, (0.85, 0.88, 1.0))
    for name, _ in cols:
        for other_name, other in cols:
            other.hide_render = other_name != name
        scene.render.filepath = str(PNG / f"{name}.png")
        bpy.ops.render.render(write_still=True)
    for name, col in cols:
        col.hide_render = name != "ai-processor"
        col.hide_viewport = name != "ai-processor"
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "portfolio-objects.blend"))


if __name__ == "__main__":
    main()
