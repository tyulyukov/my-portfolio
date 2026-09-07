import json
import math
import struct
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ASSETS = Path(__file__).resolve().parents[1] / 'public'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


def material(name, color, metallic=0, roughness=.45):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    return mat


skin = material('warm natural skin', (.50, .30, .22), roughness=.52)
brow = material('natural brown eyebrows', (.095, .062, .037), roughness=.8)
shirt = material('washed charcoal cotton', (.032, .038, .042), roughness=.93)
seam = material('charcoal ribbed collar', (.023, .028, .032), roughness=.93)
silver = material('satin aluminum', (.48, .50, .53), metallic=.75, roughness=.3)
frame = material('dark fine wire glasses', (.027, .023, .023), metallic=.7, roughness=.3)
white = material('eye glint', (.96, .96, .92), roughness=.2)
eye_white = material('warm ivory sclera', (.66, .65, .59), roughness=.37)
iris = material('muted hazel gray iris', (.095, .12, .10), roughness=.3)
pupil = material('pupil', (.006, .009, .009), roughness=.2)
black = material('keyboard graphite', (.012, .015, .019), roughness=.5)
display = material('display glass', (.009, .018, .026), metallic=.12, roughness=.23)
logo = material('polished dark Apple inlay', (.017, .020, .024), metallic=.6, roughness=.2)


def mesh(name, vertices, faces, mat, subdivision=0):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for polygon in data.polygons:
        polygon.use_smooth = True
    if subdivision:
        modifier = obj.modifiers.new('smooth sculpt', 'SUBSURF')
        modifier.levels = subdivision
    return obj


def sphere(name, location, scale, mat, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(mat)
    return obj


def box(name, location, scale, mat, bevel=.035):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new('machined rounded edge', 'BEVEL')
    modifier.width = bevel
    modifier.segments = 2 if name == 'keyboard key' else 5
    obj.modifiers.new('weighted face normals', 'WEIGHTED_NORMAL')
    obj.data.materials.append(mat)
    return obj


def curve(name, points, radius, mat, cyclic=False):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 4
    data.bevel_depth = radius
    data.bevel_resolution = 2
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for point, position in zip(spline.bezier_points, points):
        point.co = position[:3]
        point.radius = position[3] if len(position) > 3 else 1
        point.handle_left_type = 'AUTO'
        point.handle_right_type = 'AUTO'
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def rings(name, levels, mat, count=64, subdivision=1):
    vertices = []
    for z, width, depth, center_y in levels:
        for j in range(count):
            theta = 2 * math.pi * j / count
            x = width * math.sin(theta)
            y = center_y - depth * math.cos(theta)
            vertices.append((x, y, z))
    faces = []
    for i in range(len(levels) - 1):
        for j in range(count):
            a = i * count + j
            b = i * count + (j + 1) % count
            faces.append((a, a + count, b + count, b))
    faces.append(tuple(reversed(range(count))))
    faces.append(tuple((len(levels) - 1) * count + j for j in range(count)))
    return mesh(name, vertices, faces, mat, subdivision)


head_data = json.loads((ASSETS.parent/'scripts/reference/adult-head.json').read_text())


def head_point(point):
    x, height, depth = point
    neck = min(1, max(0, (7.20-height)/.60))
    point = Vector((x*.85*(1-.20*neck), -(depth-.50)*.72*(1-.28*neck), 2.40+(height-7.02)*.82))
    if height < 6.95:
        radius = math.hypot(point.x/.34, (point.y-.10)/.33)
        blend = min(1, (6.95-height)/.26)
        factor = 1-blend+blend/min(10, max(1, radius))
        point.x *= factor
        point.y = .10+(point.y-.10)*factor
    return point


vertices = [head_point(point) for point in head_data['vertices']]
for point in vertices:
    nose = math.exp(-(point.x/.15)**4-((point.z-2.98)/.23)**4)*max(0,min(1,(-point.y-.65)/.20))
    point.y -= .07*nose
    smile = math.exp(-((abs(point.x)-.205)/.095)**2-((point.z-2.665)/.12)**4)*max(0,min(1,(-point.y-.60)/.20))
    point.z += .048*smile
    eyelid = math.exp(-((abs(point.x)-.25)/.15)**4-((point.z-3.285)/.048)**2)*max(0,min(1,(-point.y-.58)/.15))
    point.z += .025*eyelid
head = mesh('Maksym adult facial anatomy', vertices, head_data['faces'], skin, subdivision=1)
lip_mask = head.data.attributes.new(name='Lip warmth', type='FLOAT', domain='POINT')
for value, weight in zip(lip_mask.data, head_data['lip_weights'], strict=True):
    value.value = weight
bpy.context.view_layer.objects.active=head
bpy.ops.object.modifier_apply(modifier=head.modifiers[0].name)
face_tree=BVHTree.FromPolygons([v.co for v in head.data.vertices], [p.vertices for p in head.data.polygons])


def face_surface(x, z, offset=.006):
    point, normal, index, distance=face_tree.ray_cast((x,-3,z),(0,1,0),6)
    if point is None:
        raise ValueError(f'Face projection missed at {x}, {z}')
    return Vector((x,point.y-offset,z))


face_mat=material('adult skin and subtle facial tones',(1,1,1),roughness=.58)
head.data.materials[0]=face_mat
colors=head.data.color_attributes.new(name='Complexion',type='FLOAT_COLOR',domain='POINT')
for vertex,color,lip_weight in zip(head.data.vertices,colors.data,head.data.attributes['Lip warmth'].data):
    x,y,z=vertex.co
    front=max(0,min(1,(-y-.30)*4))
    cheek=math.exp(-((abs(x)-.41)/.18)**2-((z-2.94)/.22)**2)*front
    beard=math.exp(-((z-2.45)/.23)**2)*front
    mouth=min(1,lip_weight.value*2)*front
    color.color=(.50-.036*beard+.018*cheek,.30-.024*beard-.018*cheek-.065*mouth,.22-.012*beard-.006*cheek-.034*mouth,1)
node=face_mat.node_tree.nodes.new('ShaderNodeVertexColor')
node.layer_name='Complexion'
face_mat.node_tree.links.new(node.outputs['Color'],face_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

for name,point in head_data['eyes'].items():
    center=head_point(point)
    sphere('natural eye sclera',center,(.128,.117,.124),eye_white,40,24)
    sphere('hazel gray iris',center+Vector((0,-.115,0)),(.054,.009,.056),iris,32,20)
    sphere('natural pupil',center+Vector((0,-.125,0)),(.026,.005,.029),pupil,24,16)
    sphere('subtle eye glint',center+Vector((-.015,-.130,.023)),(.009,.004,.010),white,16,10)
    x=center.x
    points=[]
    for j in range(9):
        u=-1+2*j/8
        z=center.z+.172+.035*(1-u*u)-.022*u*(1 if x>0 else -1)
        points.append((*face_surface(x+.18*u,z,.010),.18+.82*math.sin(math.pi*j/8)))
    curve('natural adult eyebrow',points,.027,brow)
    points=[]
    for j in range(32):
        t=math.tau*j/32
        points.append((x+.232*math.cos(t),-.845+.034*abs(math.cos(t)),center.z-.045+.230*math.sin(t)))
    curve('round wire glasses',points,.0085,frame,True)
curve('wire glasses bridge',[(-.022,-.847,3.25),(0,-.870,3.265),(.022,-.847,3.25)],.0085,frame)
for side in (-1,1):
    curve('glasses temple',[(side*.505,-.825,3.28),(side*.70,-.49,3.30),
        (side*.746,.02,3.23),(side*.70,.13,3.09)],.009,frame)

body_start = set(bpy.context.scene.objects)
torso = rings('relaxed charcoal T shirt', [
    (.24, .90, .41, .20), (.29, 1.04, .46, .18),
    (.65, 1.07, .48, .18), (1.12, 1.09, .46, .17),
    (1.54, 1.08, .40, .16), (1.79, .92, .34, .15),
    (1.95, .57, .38, .08), (2.00, .40, .38, .08),
], shirt)
for vertex in torso.data.vertices:
    vertex.co.z = .24+(vertex.co.z-.24)*1.05
collar = []
for j in range(48):
    t = math.tau*j/48
    collar.append((.40*math.sin(t), .07-.43*math.cos(t), 2.065-.052*math.cos(t)))
curve('ribbed crewneck', collar, .04, seam, True)
for side in (-1, 1):
    sleeve = rings('short loose sleeve', [
        (.71, .29, .33, .13), (.77, .31, .35, .13),
        (1.10, .34, .36, .15), (1.48, .30, .31, .16),
        (1.65, .13, .21, .16),
    ], shirt, count=40)
    for vertex in sleeve.data.vertices:
        vertex.co.z = .71+(vertex.co.z-.71)*1.20
    sleeve.location.x = side*1.0
    sleeve.rotation_euler[1] = side*-.15
    curve('sleeve hem', [(side*1.30, -.04, .76), (side*1.19, -.19, .72),
        (side*.98, -.22, .74), (side*.81, -.13, .80)], .012, seam)
    arm = sphere('bare forearm', (side*1.055, -.27, .55), (.205, .43, .19), skin, 32, 20)
    arm.rotation_euler[2] = side*-.42
    sphere('typing hand', (side*.72, -.67, .465), (.23, .22, .095), skin, 32, 20)
    for i in range(4):
        finger = sphere('typing finger', (side*(.51+i*.065), -.84+(i%2)*.028, .434),
            (.043, .15, .043), skin, 20, 12)
        finger.rotation_euler[2] = side*-.18
    sphere('typing thumb', (side*.49, -.64, .433), (.058, .12, .054), skin, 20, 12)
watch = curve('black watch strap', [(.89,-.63,.60),(.98,-.49,.48),
    (.94,-.56,.35),(.83,-.73,.45)], .033, black, True)
watch_face = sphere('black watch face', (.89, -.64, .609), (.12, .09, .029), frame, 32, 16)
sphere('watch glass', (.89, -.65, .633), (.093, .068, .008), black, 24, 12)

bpy.context.view_layer.update()
for obj in set(bpy.context.scene.objects)-body_start:
    obj.data.transform(obj.matrix_world.inverted() @ Matrix.Diagonal((1.18,1,1,1)) @ obj.matrix_world)


hair_data = json.loads((ASSETS.parent/'scripts/reference/swept-hair.json').read_text())
hair_material = material('ash blond fine hair', (1, 1, 1), roughness=.72)
hair_material.surface_render_method = 'DITHERED'
hair_material.use_backface_culling = False
texture = hair_material.node_tree.nodes.new('ShaderNodeTexImage')
texture.image = bpy.data.images.load(str(ASSETS.parent/'scripts/reference/swept-hair.png'))
texture.image.scale(1024, 1024)
shader = hair_material.node_tree.nodes['Principled BSDF']
tint = hair_material.node_tree.nodes.new('ShaderNodeMix')
tint.data_type = 'RGBA'
tint.blend_type = 'MULTIPLY'
tint.inputs[0].default_value = 1
tint.inputs[7].default_value = (.48, .43, .35, 1)
hair_material.node_tree.links.new(texture.outputs['Color'], tint.inputs[6])
hair_material.node_tree.links.new(tint.outputs[2], shader.inputs['Base Color'])
alpha_texture = hair_material.node_tree.nodes.new('ShaderNodeTexImage')
alpha_texture.image = bpy.data.images.load(str(ASSETS.parent/'scripts/reference/hair-alpha.png'))
alpha_texture.image.scale(1024, 1024)
hair_material.node_tree.links.new(alpha_texture.outputs['Alpha'], shader.inputs['Alpha'])
hair_vertices = [head_point(v) for v in hair_data['vertices']]
for point in hair_vertices:
    front = min(1, max(0, (-point.y-.30)/.30))
    point.z += .27*front*math.exp(-((point.z-3.35)/.45)**2)
    if point.z < 3.05:
        point.z = 3.05+(point.z-3.05)*.40
hair_object = mesh('Maksym swept layered hairstyle', hair_vertices,
    hair_data['faces'], hair_material)
uv_layer = hair_object.data.uv_layers.new(name='Hair UV')
for polygon, uv_face in zip(hair_object.data.polygons, hair_data['uv_faces'], strict=True):
    for loop_index, uv_index in zip(polygon.loop_indices, uv_face, strict=True):
        uv_layer.data[loop_index].uv = hair_data['uvs'][uv_index]

box('MacBook unibody base', (0,-.77,.34), (1.10,.66,.047), silver, .04)
box('keyboard inset', (0,-.70,.39), (.94,.31,.008), black, .025)
for row in range(5):
    for column in range(13):
        box('keyboard key', (-.865+column*.144,-.46-row*.11,.407), (.057,.039,.006), frame, .007)
box('trackpad outline', (0,-1.17,.391), (.33,.15,.002), frame, .02)
box('trackpad', (0,-1.17,.395), (.318,.138,.003), silver, .019)
for side in (-1,1):
    for y in (-.65,-.87):
        box('USB C port', (side*1.101,y,.337), (.002,.047,.012), black, .007)
box('MacBook thin lid', (0,-1.30,1.195), (1.10,.044,.865), silver, .045)
box('display black bezel', (0,-1.252,1.195), (1.053,.005,.815), black, .027)
box('mtos_screen', (0,-1.244,1.193), (1.024,.003,.784), display, .021)
sphere('webcam', (0,-1.235,1.996), (.012,.004,.012), frame, 16, 10)

apple_outline = [
    (-.004,.135),(-.068,.164),(-.137,.142),(-.178,.085),(-.182,.006),
    (-.157,-.080),(-.102,-.145),(-.042,-.166),(.025,-.160),(.088,-.127),
    (.135,-.068),(.155,-.005),(.120,.022),(.112,.062),(.132,.102),
    (.157,.121),(.108,.148),(.052,.163),(-.004,.135),
]
for name, outline in [('Apple bitten silhouette',apple_outline)]:
    data=bpy.data.curves.new(name,'CURVE')
    data.dimensions='2D'
    data.resolution_u=16
    data.fill_mode='BOTH'
    data.extrude=.001
    spline=data.splines.new('BEZIER')
    spline.bezier_points.add(len(outline)-2)
    for point,(x,z) in zip(spline.bezier_points,outline[:-1]):
        point.co=(x,z,0)
        point.handle_left_type='AUTO'
        point.handle_right_type='AUTO'
    spline.use_cyclic_u=True
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.rotation_euler=(math.pi/2,0,0)
    obj.location=(0,-1.357,1.19)
    obj.data.materials.append(logo)

data=bpy.data.curves.new('Apple detached leaf','CURVE')
data.dimensions='2D'
data.resolution_u=16
data.fill_mode='BOTH'
data.extrude=.001
spline=data.splines.new('BEZIER')
leaf_outline=[(.010,.180),(.036,.238),(.145,.287),(.108,.215)]
spline.bezier_points.add(len(leaf_outline)-1)
for point,(x,z) in zip(spline.bezier_points,leaf_outline):
    point.co=(x,z,0)
    point.handle_left_type='AUTO'
    point.handle_right_type='AUTO'
spline.bezier_points[0].handle_left_type='VECTOR'
spline.bezier_points[0].handle_right_type='VECTOR'
spline.bezier_points[2].handle_left_type='VECTOR'
spline.bezier_points[2].handle_right_type='VECTOR'
spline.use_cyclic_u=True
leaf=bpy.data.objects.new('Apple detached leaf',data)
bpy.context.collection.objects.link(leaf)
leaf.rotation_euler=(math.pi/2,0,0)
leaf.location=(0,-1.357,1.19)
leaf.data.materials.append(logo)

bpy.context.view_layer.update()
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('MacBook thin lid', 'display black bezel', 'mtos_screen', 'webcam', 'Apple ')):
        pivot = Vector((0, -1.30, .33))
        rotation = Matrix.Rotation(.13, 4, 'X')
        obj.matrix_world = Matrix.Translation(pivot) @ rotation @ Matrix.Translation(-pivot) @ obj.matrix_world

bpy.ops.object.select_all(action='DESELECT')
for obj in list(bpy.context.scene.objects):
    if obj.type == 'CURVE':
        obj.select_set(True)
bpy.context.view_layer.objects.active = next(obj for obj in bpy.context.scene.objects if obj.type == 'CURVE')
bpy.ops.object.convert(target='MESH')

bpy.ops.object.select_all(action='DESELECT')
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        continue
    bpy.context.view_layer.objects.active = obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    geometry = bmesh.new()
    geometry.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(geometry, faces=geometry.faces)
    geometry.to_mesh(obj.data)
    geometry.free()
    if obj != hair_object:
        for uv_layer in list(obj.data.uv_layers):
            obj.data.uv_layers.remove(uv_layer)

scene=bpy.context.scene
world=bpy.data.worlds.new('soft studio')
scene.world=world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.35,.38,.43,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5


def track(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()


for location, energy, size, color in [((-3,-4,6),550,4,(1,.88,.73)),
        ((4,-2,3),350,3,(.78,.88,1)),((1,3,5),650,3,(1,.92,.8))]:
    bpy.ops.object.light_add(type='AREA',location=location)
    light=bpy.context.object
    light.data.energy=energy
    light.data.shape='DISK'
    light.data.size=size
    light.data.color=color
    track(light,(0,0,2))
bpy.ops.object.camera_add(location=(.30,-10,3.4))
scene.camera=bpy.context.object
track(scene.camera,(0,-.3,2.24))
scene.camera.data.type='ORTHO'
scene.camera.data.ortho_scale=4.85
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=960
scene.render.resolution_y=960
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP'
scene.render.image_settings.color_mode='RGBA'
scene.render.image_settings.quality=92
scene.render.film_transparent=True
scene.render.filepath=str(ASSETS/'avatar-3d.webp')
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.render.render(write_still=True)
bpy.ops.export_scene.gltf(filepath=str(ASSETS/'avatar.glb'),export_format='GLB',
    export_apply=True,export_materials='EXPORT',export_normals=True,export_texcoords=True,
    export_cameras=False,export_lights=False,export_animations=False,export_yup=True)

model_bytes = (ASSETS/'avatar.glb').read_bytes()
json_size = struct.unpack_from('<I', model_bytes, 12)[0]
exported = json.loads(model_bytes[20:20+json_size])
exported_hair = next(mat for mat in exported['materials'] if mat['name'] == hair_material.name)
assert exported_hair['alphaMode'] in ('MASK', 'BLEND')
assert exported_hair['doubleSided']
factor = exported_hair['pbrMetallicRoughness']['baseColorFactor']
assert all(abs(a-b) < .00001 for a,b in zip(factor, (.48,.43,.35,1), strict=True))
assert len(exported['images']) == 1 and 'bufferView' in exported['images'][0]
