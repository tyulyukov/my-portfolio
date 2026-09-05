import bpy
import math
from mathutils import Vector
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / 'public'
OUT = str(ASSETS / 'avatar.glb')
RENDER = str(ASSETS / 'avatar-3d.webp')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0.0, roughness=0.45):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get('Principled BSDF')
    principled.inputs['Base Color'].default_value = (*color, 1)
    principled.inputs['Metallic'].default_value = metallic
    principled.inputs['Roughness'].default_value = roughness
    mat.metallic = metallic
    mat.roughness = roughness
    return mat

skin = material('warm skin', (0.96, 0.66, 0.48), 0, .52)
hair = material('blonde hair', (0.93, 0.68, 0.27), 0, .38)
hair_dark = material('hair shade', (0.55, 0.28, 0.08), 0, .45)
blue = material('blue sweater', (0.16, 0.36, 0.68), 0, .58)
laptop = material('silver laptop', (0.42, 0.45, 0.52), .25, .35)
screen = material('screen', (0.045, 0.065, 0.11), .1, .18)
glass = material('glasses', (0.18, 0.22, 0.27), .75, .2)
white = material('earbuds', (0.92, 0.94, 0.98), .1, .25)
eye_white = material('eye white', (.9, .95, 1), 0, .3)
iris = material('blue iris', (.11, .42, .72), 0, .22)
pupil = material('pupil', (.015, .02, .03), 0, .25)
black = material('black', (.025, .025, .035), 0, .4)

def uv(name, loc, scale, mat, seg=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    obj = bpy.context.object; obj.name = name; obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth(); obj.data.materials.append(mat)
    return obj

def cube(name, loc, scale, mat, bevel=.12):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj=bpy.context.object; obj.name=name; obj.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel_mod=obj.modifiers.new('soft corners', 'BEVEL'); bevel_mod.width=bevel; bevel_mod.segments=3
    obj.data.materials.append(mat)
    return obj

def torus(name, loc, major, minor, mat, rotation=(math.pi/2,0,0), scale=(1,1,1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=24, minor_segments=8, location=loc, rotation=rotation)
    obj=bpy.context.object; obj.name=name; obj.scale=scale; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); obj.data.materials.append(mat)
    return obj

def cylinder(name, loc, radius, depth, mat, rotation=(math.pi/2,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj=bpy.context.object; obj.name=name; obj.data.materials.append(mat)
    bevel=obj.modifiers.new('edge softness','BEVEL'); bevel.width=.035; bevel.segments=2
    return obj

uv('torso', (0, .13, .88), (1.45, .62, 1.14), blue)
cylinder('neck', (0, -.01, 1.78), .37, .35, skin, (0,0,0))
uv('head', (0, -.10, 2.68), (1.17, .86, 1.2), skin, 32, 20)

for x in (-1.14, 1.14):
    uv('ear', (x, -.05, 2.62), (.18,.14,.29), skin)
    uv('earbud', (x*1.02, -.35, 2.59), (.1,.1,.17), white)
    cylinder('earbud stem', (x*1.03, -.34, 2.35), .035, .25, white, (0,0,0))

uv('back hair', (0, .47, 2.96), (1.10,.46,.84), hair, 32, 20)
uv('hair cap', (0, .0, 3.53), (1.13,.79,.48), hair, 32, 16)
for i, (x,z,rz,sx) in enumerate(((-.69,3.48,-.25,.68),(-.28,3.68,-.12,.77),(.22,3.7,.18,.82),(.68,3.57,.39,.68))):
    lock=uv('quiff lock', (x,-.63,z), (sx,.28,.28), hair, 24, 12); lock.rotation_euler[1]=rz
uv('side hair left', (-1.03,-.31,3.12), (.19,.34,.47), hair)
uv('side hair right', (1.03,-.31,3.12), (.19,.34,.47), hair)

for x in (-.43,.43):
    uv('eye', (x,-.88,2.76), (.34,.09,.40), eye_white)
    uv('iris', (x,-.965,2.75), (.18,.045,.22), iris)
    uv('pupil', (x,-1.01,2.75), (.075,.025,.10), pupil)
    uv('eye glint', (x-.045,-1.035,2.83), (.032,.012,.04), white)
    brow=cylinder('eyebrow', (x,-.92,3.20), .052,.48,hair_dark); brow.rotation_euler[1]=(-.12 if x<0 else .12)

for x in (-.43,.43):
    torus('round glasses', (x,-1.035,2.76), .39,.038,glass, scale=(1,1,.95))
cylinder('glasses bridge', (0,-1.035,2.76), .028,.20,glass)

uv('nose', (0,-1.00,2.52), (.11,.08,.12), skin)
torus('smile', (0,-.975,2.29), .25,.028, black, scale=(1,1,.42))
cube('smile mask', (0,-1.03,2.40), (.36,.03,.14), skin, .03)

cube('laptop base', (0,-.88,1.10), (1.25,.38,.12), laptop, .11)
cube('laptop screen bezel', (0,-1.12,1.78), (1.2,.10,.83), laptop, .12)
cube('laptop lid', (0,-1.235,1.79), (1.08,.025,.70), laptop, .07)
cube('laptop display', (0,-.995,1.79), (1.08,.025,.70), screen, .07)
for x in (-.18,.18):
    for z in (1.58,1.78,1.98): cube('code glow', (x,-.96,z), (.09,.008,.016), iris, .008)
uv('laptop fruit', (0,-1.25,1.77), (.13,.018,.16), white, 16, 12)
uv('fruit bite', (.1,-1.275,1.84), (.05,.01,.05), laptop, 12, 8)

for x in (-1.23,1.23):
    uv('sleeve', (x,-.18,1.08), (.34,.46,.6), blue)
    uv('hand', (x*.94,-.92,1.18), (.22,.12,.20), skin)

uv('pedestal', (0,.14,.02), (1.65,1.0,.16), glass, 32, 12)

world=bpy.context.scene.world or bpy.data.worlds.new('World'); bpy.context.scene.world=world; world.color=(.03,.03,.05)
bpy.ops.object.light_add(type='AREA', location=(-3,-4,6)); bpy.context.object.data.energy=900; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=4
bpy.ops.object.light_add(type='AREA', location=(4,-2,3)); bpy.context.object.data.energy=600; bpy.context.object.data.size=3
bpy.ops.object.light_add(type='AREA', location=(0,3,5)); bpy.context.object.data.energy=700; bpy.context.object.data.size=3
bpy.ops.object.camera_add(location=(0,-9.2,2.55)); cam=bpy.context.object; bpy.context.scene.camera=cam
def track(obj, target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
track(cam, (0,-.25,2.05)); cam.data.lens=54
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=640; scene.render.resolution_y=640; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP'; scene.render.image_settings.color_mode='RGBA'; scene.render.image_settings.quality=88; scene.render.film_transparent=True; scene.render.filepath=RENDER
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.render.render(write_still=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_materials='EXPORT', export_normals=True, export_texcoords=False, export_cameras=False, export_lights=False, export_animations=False, export_yup=True)
