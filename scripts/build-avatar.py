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
logo = material('polished dark Apple inlay', (.017, .020, .024), metallic=.15, roughness=.38)


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
hair_vertices, hair_faces = [], []
hair_center = Vector((0, .07, 3.32))
hair_axes = Vector((.615, .755, .64))


def scalp_point(alpha, beta):
    point=hair_center+Vector((hair_axes.x*math.sin(beta)*math.sin(alpha),-hair_axes.y*math.sin(beta)*math.cos(alpha),hair_axes.z*math.cos(beta)))
    normal=Vector(((point.x-hair_center.x)/hair_axes.x**2,(point.y-hair_center.y)/hair_axes.y**2,(point.z-hair_center.z)/hair_axes.z**2)).normalized()
    return point,normal


def hair_vertex(point):
    hair_vertices.append(tuple(point))
    return len(hair_vertices)-1


columns,rows=48,18
for i in range(rows+1):
    for j in range(columns):
        alpha=math.tau*j/columns
        front=max(0,math.cos(alpha));back=max(0,-math.cos(alpha))
        edge=3.18+.33*front**3-.405*back+.020*math.sin(alpha*7+1.3)
        limit=math.acos(max(-1,min(1,(edge-3.32)/.64)))
        point,normal=scalp_point(alpha,.004+(limit-.004)*i/rows)
        hair_vertex(point)
for i in range(rows):
    for j in range(columns):
        a=i*columns+j;b=i*columns+(j+1)%columns;hair_faces.append((a,b,b+columns,a+columns))
hair_faces.append(tuple(reversed(range(columns))))
center=hair_vertex((0,.15,3.28))
for j in range(columns):hair_faces.append((rows*columns+j,rows*columns+(j+1)%columns,center))


def hair_lock(alpha0,beta0,alpha1,beta1,width,lift):
    samples,sides=16,10
    path=[];normals=[]
    for i in range(samples):
        t=i/(samples-1);ease=t*t*(3-2*t)
        alpha=alpha0+(alpha1-alpha0)*ease
        beta=beta0+(beta1-beta0)*t
        point,normal=scalp_point(alpha,beta)
        offset=-.025*(1-min(1,t/.12))+.012+lift*math.sin(math.pi*t)**.8
        path.append(point+normal*offset);normals.append(normal)
    start=len(hair_vertices)
    previous_wide=None
    for i,(point,normal) in enumerate(zip(path,normals,strict=True)):
        t=i/(samples-1)
        tangent=(path[min(i+1,samples-1)]-path[max(i-1,0)]).normalized()
        thin=(normal-tangent*normal.dot(tangent)).normalized()
        wide=tangent.cross(thin).normalized()
        if previous_wide is not None and wide.dot(previous_wide)<0:wide=-wide;thin=-thin
        previous_wide=wide
        taper=(.38+.62*min(1,t/.16))*(1-.96*t**2.4)
        broad=width*taper;narrow=width*.29*taper
        for j in range(sides):
            a=math.tau*j/sides
            contour=point+wide*math.cos(a)*broad+thin*math.sin(a)*narrow
            hair_vertex(contour)
    for i in range(samples-1):
        for j in range(sides):
            a=start+i*sides+j;b=start+i*sides+(j+1)%sides;hair_faces.append((a,b,b+sides,a+sides))
    hair_faces.append(tuple(reversed(range(start,start+sides))))
    hair_faces.append(tuple(range(start+(samples-1)*sides,start+samples*sides)))


locks=[]
for i in range(18):
    locks.append((.32+.025*i,.24+.040*i,-.60-.040*i,1.20+.019*i,.041+.008*math.sin(i*1.7),.010+.005*math.sin(i)))
for i in range(6):
    locks.append((-.1+.15*i,1.00+.023*i,-.68+.235*i,1.38+.033*math.sin(i*1.7),.037+.006*math.sin(i),.018))
for i in range(10):
    locks.append((.30+.14*i,.18+.03*i,1.40+.11*i,.90+.06*i,.046,.015))
for side,count in [(-1,14),(1,15)]:
    for i in range(count):
        locks.append((side*(.87+.070*i),.50+.07*(i%5),side*(1.10+.07*i),1.48+.08*(i%4),.048+.009*math.sin(i),.018))
for i in range(20):
    angle=2.10+i*.11
    locks.append((angle-.17,.73+.11*(i%3),angle,2.11+.10*(i%5),.066,.025))
for lock in locks:hair_lock(*lock)
hair_object=projected_mesh('Maksym swept sculpted hair',hair_vertices,hair_faces,subdivision=0)
for loop in hair_object.data.loops:
    point=hair_object.data.vertices[loop.vertex_index].co
    front=hair_object.data.uv_layers['Front projection'].data[loop.index].uv
    pixel_y=min((1-front.y)*front_height,460-70*max(0,point.x)/.6)
    front.y=1-pixel_y/front_height
    uv=hair_object.data.uv_layers['Profile projection'].data[loop.index].uv
    px,py=uv.x*profile_width,(1-uv.y)*profile_height
    if py>540:px=max(px,870)
    uv.x=px/profile_width
    hair_object.data.uv_layers['Back projection'].data[loop.index].uv=((627-point.x*410)/1254,1-(65+(4.01-point.z)*590)/1254)
geometry=bmesh.new();geometry.from_mesh(hair_object.data)
assert all(edge.is_manifold for edge in geometry.edges)
geometry.free()
hair_object=bake_portrait([hair_object],'portrait hair',1536,(.54,.54,.54),.78)

eyewear=material('fine graphite titanium eyewear',(.018,.017,.016),metallic=.78,roughness=.36)
pad_material=material('soft translucent nose pads',(.32,.22,.16),roughness=.48)
for side in (-1,1):
    outline=[]
    for j in range(72):
        t=math.tau*j/72
        x=side*.234+.198*math.cos(t)
        outline.append((x,-.78+.08*(abs(x)/.44)**2,3.155+.193*math.sin(t)))
    curve('round titanium spectacle rim',outline,.0034,eyewear,True)
    curve('fitted spectacle temple',[(side*.431,-.703,3.185),(side*.475,-.66,3.181),(side*.525,-.40,3.17),(side*.555,-.02,3.152),(side*.565,.22,3.10),(side*.548,.30,3.01)],.0037,eyewear)
    sphere('spectacle hinge',(side*.442,-.697,3.185),(.013,.008,.008),eyewear,16,8)
    curve('nose pad arm',[(side*.044,-.781,3.155),(side*.060,-.797,3.128),(side*.066,-.796,3.108)],.002,eyewear)
    pad=sphere('fitted nose pad',(side*.066,-.793,3.106),(.007,.005,.015),pad_material,16,10)
    pad.rotation_euler.y=side*.30
curve('titanium saddle bridge',[(-.043,-.779,3.207),(-.025,-.787,3.225),(0,-.791,3.232),(.025,-.787,3.225),(.043,-.779,3.207)],.0033,eyewear)

body_start = set(bpy.context.scene.objects)


def body_loft(name, sections, mat, sides=18):
    vertices, faces = [], []
    centers = [Vector(section[:3]) for section in sections]
    for i, section in enumerate(sections):
        center = centers[i]
        tangent = (centers[min(i + 1, len(centers) - 1)] - centers[max(i - 1, 0)]).normalized()
        across = (Vector((1, 0, 0)) - tangent * tangent.x).normalized()
        up = tangent.cross(across).normalized()
        radius_a, radius_b = section[3], section[4]
        for j in range(sides):
            angle = math.tau * j / sides
            point = center + across * math.cos(angle) * radius_a + up * math.sin(angle) * radius_b
            vertices.append(tuple(point))
    for i in range(len(sections) - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces.append(tuple(reversed(range(sides))))
    end = (len(sections) - 1) * sides
    faces.append(tuple(end + j for j in range(sides)))
    return mesh(name, vertices, faces, mat)


torso = rings('tailored washed charcoal crewneck', [
    (.25, .82, .39, .16), (.38, .89, .42, .15), (.77, .94, .44, .14),
    (1.18, .97, .42, .13), (1.52, .93, .39, .12), (1.73, .78, .35, .11),
    (1.85, .66, .31, .10), (1.98, .33, .29, .10),
], shirt, count=56, subdivision=1)
neckline = rings('stitched crewneck neckline', [
    (1.83, .40, .35, .10), (1.94, .34, .32, .10), (2.01, .305, .32, .10),
], shirt, count=48, subdivision=1)
cloth_parts = [torso, neckline]
for vertex in torso.data.vertices:
    vertex.co.y += .035 * max(0, 1 - abs(vertex.co.x) / .98) * math.sin((vertex.co.z - .25) * 2.5)

collar = []
for j in range(56):
    angle = math.tau * j / 56
    collar.append((.31 * math.sin(angle), .10 - .335 * math.cos(angle), 2.005))
curve('ribbed fitted crewneck', collar, .027, seam, True)

for side in (-1, 1):
    sleeve = body_loft('connected short sleeve', [
        (side * .58, .10, 1.70, .12, .18),
        (side * .76, .07, 1.49, .22, .24),
        (side * .81, .03, 1.22, .20, .23),
        (side * .81, .02, .96, .165, .20),
        (side * .79, .00, .84, .15, .18),
    ], shirt, 22)
    cloth_parts.append(sleeve)
    body_loft('folded charcoal sleeve cuff',[
        (side*.80,.01,.875,.16,.19),
        (side*.795,.005,.84,.164,.194),
        (side*.79,0,.81,.155,.184),
    ],shirt,24)

    forearm = body_loft('anatomical bare forearm', [
        (side * .83, .01, .86, .15, .16),
        (side * .84, .03, .76, .16, .17),
        (side * .77, -.10, .67, .15, .16),
        (side * .64, -.33, .57, .14, .14),
        (side * .55, -.50, .51, .115, .115),
    ], skin, 20)

    palm = body_loft('sculpted typing palm', [
        (side * .55, -.49, .51, .12, .11),
        (side * .56, -.61, .485, .17, .10),
        (side * .57, -.73, .465, .18, .085),
    ], skin, 18)

    finger_parts = [forearm, palm]
    for index, offset in enumerate((-.135,-.045,.050,.14)):
        root_x=side*(.57+offset)
        tip_x=side*(.57+offset*1.22)
        radius=(.034,.036,.034,.027)[index]
        end_y=(-.925,-.965,-.941,-.883)[index]
        finger_parts.append(body_loft('curled typing digit',[
            (root_x,-.70,.477,radius*1.18,radius*1.10),
            (root_x,-.79,.469,radius,radius),
            (tip_x,end_y+.043,.435,radius*.9,radius*.9),
            (tip_x,end_y,.418,radius*.68,radius*.72),
        ],skin,16))
    finger_parts.append(body_loft('opposed thumb on spacebar',[
        (side*.435,-.595,.48,.052,.050),
        (side*.36,-.565,.476,.047,.044),
        (side*.285,-.552,.453,.040,.038),
        (side*.26,-.555,.426,.029,.028),
    ],skin,16))

    bpy.ops.object.select_all(action='DESELECT')
    for part in finger_parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = palm
    bpy.ops.object.join()
    palm.name = 'voxel-fused anatomical typing hand'
    remesh = palm.modifiers.new('fused palm and fingers', 'REMESH')
    remesh.mode = 'VOXEL'
    remesh.voxel_size = .012
    remesh.use_smooth_shade = True
    bpy.context.view_layer.objects.active = palm
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth = palm.modifiers.new('soft anatomical transitions', 'SMOOTH');smooth.factor=.4;smooth.iterations=3
    bpy.ops.object.modifier_apply(modifier=smooth.name)

bpy.ops.object.select_all(action='DESELECT')
for obj in cloth_parts:
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    for modifier in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
bpy.context.view_layer.objects.active=torso;bpy.ops.object.join()
remesh=torso.modifiers.new('continuous tailored shirt','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.028;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=torso.modifiers.new('relaxed fabric transitions','SMOOTH');smooth.factor=.48;smooth.iterations=4
bpy.ops.object.modifier_apply(modifier=smooth.name)
decimate=torso.modifiers.new('cloth mesh budget','DECIMATE');decimate.ratio=.58
bpy.ops.object.modifier_apply(modifier=decimate.name)
watch_center=Vector((.58,-.44,.55));watch_axis=Vector((.15,.9,.32)).normalized()
watch_across=(Vector((1,0,0))-watch_axis*watch_axis.x).normalized();watch_up=watch_across.cross(watch_axis).normalized()
for offset in (-.024,.024):
    points=[]
    for j in range(40):
        a=math.tau*j/40;points.append(tuple(watch_center+watch_axis*offset+watch_across*math.cos(a)*.135+watch_up*math.sin(a)*.132))
    curve('fitted matte black watch band',points,.014,black,True)
watch_case=box('black wristwatch case',tuple(watch_center+watch_up*.137),(.106,.082,.024),frame,.020)
watch_case.rotation_euler=watch_up.to_track_quat('Z','Y').to_euler()
watch_glass=box('wristwatch glass',tuple(watch_center+watch_up*.163),(.083,.060,.002),black,.013)
watch_glass.rotation_euler=watch_case.rotation_euler

bpy.context.view_layer.update()
for obj in set(bpy.context.scene.objects) - body_start:
    obj.data.transform(obj.matrix_world.inverted() @ Matrix.Diagonal((1.18, 1, 1, 1)) @ obj.matrix_world)

def rounded_panel(name, center, width, height, thickness, mat, radius=.045, vertical=False):
    outline=[]
    for cx,cy,start in [(width/2-radius,height/2-radius,0),(-width/2+radius,height/2-radius,90),(-width/2+radius,-height/2+radius,180),(width/2-radius,-height/2+radius,270)]:
        for j in range(7):
            a=math.radians(start+j*90/6)
            outline.append((cx+radius*math.cos(a),cy+radius*math.sin(a)))
    vertices=[]
    for depth in (-thickness/2,thickness/2):
        for u,v in outline:
            local=(u,depth,v) if vertical else (u,v,depth)
            vertices.append(local)
    n=len(outline)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces.extend((j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n))
    obj=mesh(name,vertices,faces,mat)
    obj.location=center
    bevel=obj.modifiers.new('fine machined edge','BEVEL');bevel.width=min(.003,thickness*.2);bevel.segments=2;bevel.harden_normals=True
    normals=obj.modifiers.new('planar casing normals','WEIGHTED_NORMAL');normals.keep_sharp=True;normals.weight=50
    return obj


aluminum=material('MacBook bead blasted silver',(.58,.60,.63),metallic=.92,roughness=.28)
key_material=material('MacBook matte keycaps',(.012,.014,.017),roughness=.62)
key_legend=material('MacBook warm white legends',(.59,.61,.64),roughness=.7)
rubber=material('MacBook graphite rubber',(.009,.010,.012),roughness=.94)
rounded_panel('MacBook lower enclosure',(0,-.55,.331),2.20,1.50,.055,aluminum,.060)
rounded_panel('MacBook precision deck',(0,-.55,.363),2.20,1.50,.025,aluminum,.060)
rounded_panel('MacBook keyboard well',(0,-.79,.378),1.84,.655,.010,black,.040)
keycaps=[];legends=[]
keyboard_rows=[
    ([1.35]+[1]*12+ [1.35],['esc']+['']*12+[''],.036),
    ([1]*13+[1.70],list('`1234567890-=')+['delete'],.051),
    ([1.5]+[1]*12+[1.2],['tab']+list('QWERTYUIOP[]')+['\\'],.051),
    ([1.8]+[1]*11+[1.9],['caps']+list("ASDFGHJKL;'")+['return'],.051),
    ([2.3]+[1]*10+[2.4],['shift']+list('ZXCVBNM,./')+['shift'],.051),
    ([1,1,1,1.3,5.6,1.3,1,1,1,1],['fn','','','cmd','','cmd','','','',''],.049),
]
for row,(units,labels,halfheight) in enumerate(keyboard_rows):
    pitch=1.77/sum(units);cursor=-.885;y=-1.052+row*.105
    for unit,label in zip(units,labels,strict=True):
        width=unit*pitch-.012;x=-(cursor+unit*pitch/2);cursor+=unit*pitch
        keycaps.append(rounded_panel('MacBook key',(x,y,.391),width,halfheight*1.65,.014,key_material,min(.013,width*.15)))
        if len(label)==1:
            data=bpy.data.curves.new('key legend','FONT');data.body=label;data.size=.025;data.align_x='CENTER';data.align_y='CENTER'
            text=bpy.data.objects.new('MacBook key legend',data);bpy.context.collection.objects.link(text);text.location=(x,y,.399);text.rotation_euler.z=math.pi;text.data.materials.append(key_legend);legends.append(text)
for objects,name in [(keycaps,'MacBook keyboard'),(legends,'MacBook key legends')]:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True);bpy.context.view_layer.objects.active=obj
        for modifier in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.context.view_layer.objects.active=objects[0]
    if objects[0].type=='FONT':bpy.ops.object.convert(target='MESH')
    bpy.ops.object.join();bpy.context.object.name=name
rounded_panel('MacBook trackpad seam',(0,-.165,.378),.88,.37,.005,frame,.028)
rounded_panel('MacBook glass trackpad',(0,-.165,.382),.869,.359,.004,aluminum,.026)
for side in (-1,1):
    rounded_panel('MacBook speaker grille',(side*.994,-.79,.379),.090,.635,.004,frame,.012)
    for row in range(26):
        for column in range(3):
            sphere('MacBook speaker perforation',(side*(.965+column*.028),-1.075+row*.022,.382),(.006,.006,.0015),black,8,4)
    for y in (-1.005,-.83):
        port=rounded_panel('MacBook USB C port',(0,0,0),.083,.024,.003,black,.008,vertical=True)
        port.rotation_euler.z=math.pi/2;port.location=(side*1.099,y,.341)
    for y in (-1.12,.065):
        sphere('MacBook rubber foot',(side*.88,y,.299),(.053,.053,.008),rubber,20,8)
        sphere('MacBook bottom screw',(side*1.02,y,.302),(.009,.009,.0015),frame,12,4)
curve('MacBook hinge spine',[(-.95,-1.276,.384),(.95,-1.276,.384)],.025,black)

lid=[]
lid.append(rounded_panel('MacBook thin lid',(0,-1.276,1.109),2.20,1.445,.034,aluminum,.059,True))
lid.append(rounded_panel('MacBook black display surround',(0,-1.256,1.109),2.123,1.368,.006,black,.042,True))
lid.append(rounded_panel('mtos_screen',(0,-1.251,1.112),2.024,1.265,.004,display,.025,True))
lid.append(sphere('MacBook webcam',(0,-1.246,1.78),(.009,.002,.009),frame,16,8))
for index,outline in enumerate(json.loads((ROOT/'scripts/reference/apple-logo.json').read_text())['outlines']):
    data=bpy.data.curves.new('MacBook Apple inlay','CURVE');data.dimensions='2D';data.fill_mode='BOTH';data.extrude=.0004
    spline=data.splines.new('POLY');spline.points.add(len(outline)-1)
    for point,(x,y) in zip(spline.points,outline,strict=True):point.co=((x-192)*.28/448,(256-y)*.28/448,0,1)
    spline.use_cyclic_u=True
    obj=bpy.data.objects.new('MacBook Apple inlay',data);bpy.context.collection.objects.link(obj);obj.rotation_euler.x=math.pi/2;obj.location=(0,-1.2945,1.109);obj.data.materials.append(logo);lid.append(obj)
bpy.context.view_layer.update()
pivot=Vector((0,-1.276,.386));rotation=Matrix.Rotation(.16,4,'X')
for obj in lid:obj.matrix_world=Matrix.Translation(pivot)@rotation@Matrix.Translation(-pivot)@obj.matrix_world

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

macbook_materials = {}
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH' and obj.name.startswith('MacBook ') and len(obj.data.materials) == 1:
        macbook_materials.setdefault(obj.data.materials[0].name, []).append(obj)
for material_name, objects in macbook_materials.items():
    if len(objects) < 2:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    bpy.context.object.name = 'MacBook ' + material_name

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
    export_copyright='Apple icon adapted from Font Awesome Free 6.7.2, copyright Fonticons, Inc., CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); source: https://github.com/FortAwesome/Font-Awesome/blob/6.7.2/svgs/brands/apple.svg. Face topology adapted from MediaPipe, Apache-2.0 (https://www.apache.org/licenses/LICENSE-2.0).',
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
