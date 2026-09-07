import json
import math
import struct
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public'
if bpy.app.version != (5, 2, 1):
    raise RuntimeError(f'Avatar rebuild requires Blender 5.2.1; found {bpy.app.version_string}')
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
shirt = material('washed charcoal cotton', (.032, .038, .042), roughness=.93)
seam = material('charcoal ribbed collar', (.023, .028, .032), roughness=.93)
silver = material('satin aluminum', (.48, .50, .53), metallic=.75, roughness=.3)
frame = material('dark fine wire glasses', (.027, .023, .023), metallic=.7, roughness=.3)
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


REFERENCE = ROOT / 'scripts' / 'reference' / 'likeness'
face_data = json.loads((REFERENCE / 'face.json').read_text())
projection = face_data['projection']
ppunit = projection['pixels_per_unit']
eye_x, eye_y = projection['eye_center']
eye_height = projection['eye_height']
front_width, front_height = projection['image_size']
profile_projection = face_data['profile_trace']
profile_width, profile_height = profile_projection['image_size']

def front_uv(point):
    return ((eye_x + point[0] * ppunit) / front_width,
        1 - (eye_y + (eye_height - point[2]) * ppunit) / front_height)

def profile_uv(point):
    scale = profile_projection['pixels_per_unit']
    return ((profile_projection['nose_x'] + (point[1] - profile_projection['nose_depth']) * scale) / profile_width,
        1 - (profile_projection['eye_y'] + (eye_height - point[2]) * scale) / profile_height)

def projected_mesh(name, points, faces, front_coordinates=None, subdivision=1):
    obj = mesh(name, points, faces, skin, subdivision)
    front_layer = obj.data.uv_layers.new(name='Front projection')
    profile_layer = obj.data.uv_layers.new(name='Profile projection')
    back_layer = obj.data.uv_layers.new(name='Back projection')
    for poly in obj.data.polygons:
        for loop_index in poly.loop_indices:
            index = obj.data.loops[loop_index].vertex_index
            front_layer.data[loop_index].uv = front_coordinates[index] if front_coordinates else front_uv(points[index])
            profile_layer.data[loop_index].uv = profile_uv(points[index])
            point = points[index]
            back_layer.data[loop_index].uv = ((627 - point[0] * 430) / 1254, 1 - (45 + (4.01 - point[2]) * 625) / 1254)
    weights = obj.data.attributes.new(name='Profile weight', type='FLOAT', domain='POINT')
    for item, point in zip(weights.data, points, strict=True):
        t = min(1, max(0, (point[1] + 0.52) / 0.52))
        item.value = t * t * (3 - 2 * t)
    back_weights = obj.data.attributes.new(name='Back weight', type='FLOAT', domain='POINT')
    for item, point in zip(back_weights.data, points, strict=True):
        t = min(1, max(0, (point[1] - 0.42) / 0.22))
        item.value = t * t * (3 - 2 * t)
    return obj
points = [tuple(v) for v in face_data['vertices']]
faces = [tuple(f) for f in face_data['faces']]
front_coordinates = list(face_data['uv'])
boundary = face_data['boundaries'][0]
previous = boundary
for ring in range(1, 13):
    t = ring / 13
    ring_indices = []
    for index in boundary:
        x, y, z = face_data['vertices'][index]
        width = math.cos(t * math.pi / 2)
        vertex = (x * width, y * width + 0.77 * math.sin(t * math.pi / 2), 3.05 + (z - 3.05) * width + max(0, z - 3.05) * 0.65 * math.sin(math.pi * t))
        ring_indices.append(len(points))
        points.append(vertex)
        front_coordinates.append(front_uv(vertex))
    for j in range(len(boundary)):
        k = (j + 1) % len(boundary)
        faces.append((previous[j], previous[k], ring_indices[k], ring_indices[j]))
    previous = ring_indices
points.append((0, 0.77, 3.05))
front_coordinates.append(front_uv(points[-1]))
center = len(points) - 1
for j in range(len(boundary)):
    faces.append((previous[j], previous[(j + 1) % len(boundary)], center))
head = projected_mesh('Maksym photo-fitted facial anatomy', points, faces, front_coordinates, 2)
head_parts = [head]
points, faces = ([], [])
for i in range(8):
    z = 1.97 + i * 0.19
    for j in range(48):
        t = math.tau * j / 48
        points.append((0.295 * math.sin(t), 0.1 - 0.32 * math.cos(t), z))
for i in range(7):
    for j in range(48):
        a = i * 48 + j
        b = i * 48 + (j + 1) % 48
        faces.append((a, b, b + 48, a + 48))
neck = projected_mesh('portrait neck', points, faces, subdivision=1)
for loop in neck.data.loops:
    point = neck.data.vertices[loop.vertex_index].co
    neck.data.uv_layers['Back projection'].data[loop.index].uv = ((627 - point.x * 550) / 1254, 1 - (950 + (2.9 - point.z) * 180) / 1254)
for vertex in neck.data.vertices:
    front_mix = min(1, max(0, (vertex.co.y + 0.18) / 0.30))
    back_mix = min(1, max(0, (vertex.co.y - 0.10) / 0.25))
    neck.data.attributes['Profile weight'].data[vertex.index].value = front_mix * front_mix * (3 - 2 * front_mix)
    neck.data.attributes['Back weight'].data[vertex.index].value = back_mix * back_mix * (3 - 2 * back_mix)
head_parts.append(neck)

def bake_portrait(objects, name, resolution, tint, roughness):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        bpy.context.view_layer.objects.active = obj
        for modifier in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    obj = objects[0]
    geometry = bmesh.new()
    geometry.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(geometry, faces=geometry.faces)
    geometry.to_mesh(obj.data)
    geometry.free()
    mat = material(name, (1, 1, 1), roughness=roughness)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    output = nodes.get('Material Output')
    shader = nodes.get('Principled BSDF')
    front = nodes.new('ShaderNodeTexImage')
    front.image = bpy.data.images.load(str(REFERENCE / 'front.png'), check_existing=True)
    profile = nodes.new('ShaderNodeTexImage')
    profile.image = bpy.data.images.load(str(REFERENCE / 'profile.png'), check_existing=True)
    back = nodes.new('ShaderNodeTexImage')
    back.image = bpy.data.images.load(str(REFERENCE / 'back.png'), check_existing=True)
    for node, layer in [(front, 'Front projection'), (profile, 'Profile projection'), (back, 'Back projection')]:
        node.extension = 'EXTEND'
        uv = nodes.new('ShaderNodeUVMap')
        uv.uv_map = layer
        links.new(uv.outputs['UV'], node.inputs['Vector'])
    weight = nodes.new('ShaderNodeAttribute')
    weight.attribute_name = 'Profile weight'
    mix = nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'MIX'
    links.new(weight.outputs['Fac'], mix.inputs[0])
    links.new(front.outputs['Color'], mix.inputs[1])
    links.new(profile.outputs['Color'], mix.inputs[2])
    rear_weight = nodes.new('ShaderNodeAttribute')
    rear_weight.attribute_name = 'Back weight'
    rear_mix = nodes.new('ShaderNodeMixRGB')
    rear_mix.blend_type = 'MIX'
    links.new(rear_weight.outputs['Fac'], rear_mix.inputs[0])
    links.new(mix.outputs[0], rear_mix.inputs[1])
    links.new(back.outputs['Color'], rear_mix.inputs[2])
    emission = nodes.new('ShaderNodeEmission')
    links.new(rear_mix.outputs[0], emission.inputs['Color'])
    links.new(emission.outputs[0], output.inputs['Surface'])
    atlas = obj.data.uv_layers.new(name='Portrait atlas')
    obj.data.uv_layers.active = atlas
    atlas.active_render = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.015)
    bpy.ops.object.mode_set(mode='OBJECT')
    baked = bpy.data.images.new(name + ' atlas', width=resolution, height=resolution, alpha=False)
    target = nodes.new('ShaderNodeTexImage')
    target.image = baked
    nodes.active = target
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 1
    bpy.ops.object.bake(type='EMIT', margin=12)
    baked.pack()
    for node in list(nodes):
        if node not in (output, shader, target):
            nodes.remove(node)
    color = nodes.new('ShaderNodeMix')
    color.data_type = 'RGBA'
    color.blend_type = 'MULTIPLY'
    color.inputs[0].default_value = 1
    color.inputs[7].default_value = (*tint, 1)
    links.new(target.outputs['Color'], color.inputs[6])
    links.new(color.outputs[2], shader.inputs['Base Color'])
    links.new(shader.outputs[0], output.inputs['Surface'])
    for layer in list(obj.data.uv_layers):
        if layer.name != 'Portrait atlas':
            obj.data.uv_layers.remove(layer)
    return obj
head = bake_portrait(head_parts, 'portrait skin', 2048, (0.68, 0.68, 0.68), 0.88)
points, faces = ([], [])
rows, columns = (40, 96)
for i in range(rows + 1):
    for j in range(columns):
        theta = math.tau * j / columns
        front = max(0, math.cos(theta))
        back = max(0, -math.cos(theta))
        minimum = 3.27 + 0.16 * front ** 4 - 0.67 * back + 0.12 * math.sin(theta) * front
        maximum = math.acos(max(-1, min(1, (minimum - 3.29) / 0.72)))
        phi = 0.003 + (maximum - 0.003) * i / rows
        points.append((0.69 * math.sin(phi) * math.sin(theta), 0.06 - 0.87 * math.sin(phi) * math.cos(theta) + 0.09 * front * math.exp(-((i / rows - 1) / 0.18) ** 2), 3.29 + 0.72 * math.cos(phi)))
for i in range(rows):
    for j in range(columns):
        a = i * columns + j
        b = i * columns + (j + 1) % columns
        faces.append((a, b, b + columns, a + columns))
hair_object = projected_mesh('Maksym portrait hairstyle', points, faces, subdivision=1)
for loop in hair_object.data.loops:
    point = hair_object.data.vertices[loop.vertex_index].co
    uv = hair_object.data.uv_layers['Profile projection'].data[loop.index].uv
    px, py = (uv.x * profile_width, (1 - uv.y) * profile_height)
    if py > 540:
        px = max(px, 850)
    hair_object.data.uv_layers['Profile projection'].data[loop.index].uv = (px / profile_width, 1 - py / profile_height)
    hair_object.data.uv_layers['Back projection'].data[loop.index].uv = ((627 - point.x * 410) / 1254, 1 - (65 + (4.01 - point.z) * 590) / 1254)
hair_object = bake_portrait([hair_object], 'portrait hair', 1024, (0.67, 0.67, 0.67), 0.75)
for side in (-1, 1):
    points = []
    for j in range(40):
        t = math.tau * j / 40
        points.append((side * 0.23 + 0.214 * math.cos(t), -0.88 + 0.16 * (abs(side * 0.23 + 0.214 * math.cos(t)) / 0.46) ** 2, 3.165 + 0.207 * math.sin(t)))
    curve('round fine wire glasses', points, 0.006, frame, True)
    curve('glasses temple', [(side * 0.448, -0.728, 3.2), (side * 0.57, -0.34, 3.19), (side * 0.61, 0.19, 3.12), (side * 0.575, 0.31, 3.03)], 0.006, frame)
curve('glasses bridge', [(-0.017, -0.91, 3.21), (0, -0.94, 3.235), (0.017, -0.91, 3.21)], 0.006, frame)

body_start = set(bpy.context.scene.objects)
torso = rings('relaxed charcoal T shirt', [
    (.24, .90, .41, .20), (.29, 1.04, .46, .18),
    (.65, 1.07, .48, .18), (1.12, 1.09, .46, .17),
    (1.54, 1.08, .40, .16), (1.79, .92, .34, .15),
    (1.95, .57, .38, .08), (2.00, .285, .30, .10),
], shirt)
for vertex in torso.data.vertices:
    vertex.co.z = .24+(vertex.co.z-.24)*1.05
collar = []
for j in range(48):
    t = math.tau*j/48
    collar.append((.285*math.sin(t), .10-.33*math.cos(t), 2.065-.052*math.cos(t)))
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
    if obj not in (head, hair_object):
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
    export_image_format='JPEG',export_jpeg_quality=92,
    export_cameras=False,export_lights=False,export_animations=False,export_yup=True)

model = (ASSETS / 'avatar.glb').read_bytes()
json_size = struct.unpack_from('<I', model, 12)[0]
gltf = json.loads(model[20:20 + json_size])
screens = [node for node in gltf['nodes'] if node.get('name') == 'mtos_screen']
assert len(screens) == 1
assert gltf['meshes'][screens[0]['mesh']]['primitives']
assert len(gltf['images']) == 2
assert all('uri' not in image for image in gltf['images'])
for name in ('portrait skin', 'portrait hair'):
    exported = next(mat for mat in gltf['materials'] if mat['name'] == name)
    assert 'baseColorTexture' in exported['pbrMetallicRoughness']
    assert exported.get('alphaMode', 'OPAQUE') == 'OPAQUE'
for obj in (head, hair_object):
    assert len(obj.data.uv_layers) == 1
    assert all(math.isfinite(value) for vertex in obj.data.vertices for value in vertex.co)
