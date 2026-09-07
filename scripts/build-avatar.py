import math
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Vector

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


skin = material('warm natural skin', (.64, .405, .30), roughness=.52)
skin_shadow = material('ear and nostril warmth', (.29, .115, .075), roughness=.65)
lips = material('natural muted rose lips', (.52, .28, .23), roughness=.58)
lip_line = material('closed smile crease', (.29, .12, .09), roughness=.7)
hair = material('ash brown roots', (.115, .082, .049), roughness=.5)
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


def interpolate(levels, z):
    for i in range(len(levels) - 1):
        if z <= levels[i + 1][0]:
            t = (z - levels[i][0]) / (levels[i + 1][0] - levels[i][0])
            a, b = levels[max(0, i - 1)], levels[i]
            c, d = levels[i + 1], levels[min(len(levels) - 1, i + 2)]
            span = c[0] - b[0]
            return tuple((2*t**3-3*t*t+1)*b[k] +
                (t**3-2*t*t+t)*span*(c[k]-a[k])/(c[0]-a[0]) +
                (-2*t**3+3*t*t)*c[k] +
                (t**3-t*t)*span*(d[k]-b[k])/(d[0]-b[0]) for k in range(1, 4))
    return levels[-1][1:]


face_levels = [
    (2.30, .035, .08, -.08), (2.35, .22, .32, -.04),
    (2.44, .36, .43, .015), (2.58, .48, .50, .025),
    (2.80, .58, .535, .035), (3.02, .66, .555, .035),
    (3.24, .69, .60, .04), (3.46, .68, .635, .05),
    (3.70, .66, .64, .065), (3.92, .52, .52, .07),
    (4.06, .26, .29, .075), (4.10, .025, .04, .075),
]


def face_y(x, z):
    width, depth, center = interpolate(face_levels, z)
    y = center - depth * math.sqrt(max(0, 1-(x/width)**2))
    y -= .105 * math.exp(-(x/.115)**2 - ((z-3.17)/.27)**2)
    y -= .205 * math.exp(-(x/.110)**2 - ((z-3.015)/.12)**2)
    y -= .074 * math.exp(-((abs(x)-.105)/.066)**2 - ((z-2.97)/.063)**2)
    y -= .04 * math.exp(-(x/.24)**2 - ((z-2.75)/.15)**2)
    y += .045 * math.exp(-((abs(x)-.29)/.19)**2 - ((z-3.25)/.14)**2)
    return y


vertices, faces = [], []
rows, columns = 112, 128
for i in range(rows + 1):
    z = 2.30 + 1.80*i/rows
    width, depth, center = interpolate(face_levels, z)
    for j in range(columns):
        theta = math.tau*j/columns
        x = width*math.sin(theta)
        y = face_y(x, z) if math.cos(theta) >= 0 else center-depth*math.cos(theta)
        vertices.append((x, y, z))
for i in range(rows):
    for j in range(columns):
        a = i*columns+j
        b = i*columns+(j+1)%columns
        faces.append((a, a+columns, b+columns, b))
faces.extend([tuple(reversed(range(columns))), tuple(rows*columns+j for j in range(columns))])
head = mesh('Maksym sculpted oval face', vertices, faces, skin)
face_mat = material('skin with cheek and jaw tones', (1, 1, 1), roughness=.55)
head.data.materials[0] = face_mat
colors = head.data.color_attributes.new(name='Complexion', type='FLOAT_COLOR', domain='POINT')
for vertex, color in zip(head.data.vertices, colors.data):
    x, y, z = vertex.co
    front = max(0, min(1, -y*3))
    blush = .16*math.exp(-((abs(x)-.43)/.17)**2 - ((z-3.01)/.16)**2)*front
    stubble = .10*math.exp(-((z-2.48)/.22)**2)*front
    base = (.64, .405, .30)
    color.color = (base[0]-stubble*.7, base[1]-blush*.5-stubble*.55, base[2]-blush*.22-stubble*.32, 1)
node = face_mat.node_tree.nodes.new('ShaderNodeVertexColor')
node.layer_name = 'Complexion'
face_mat.node_tree.links.new(node.outputs['Color'], face_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

rings('slender neck', [
    (1.88, .35, .28, .1), (2.03, .29, .27, .10),
    (2.24, .245, .25, .10), (2.47, .27, .28, .12),
    (2.59, .34, .30, .14),
], skin, count=48)
torso = rings('relaxed charcoal T shirt', [
    (.24, .90, .41, .20), (.29, 1.04, .46, .18),
    (.65, 1.07, .48, .18), (1.12, 1.09, .46, .17),
    (1.54, 1.08, .40, .16), (1.79, .92, .34, .15),
    (1.95, .57, .27, .12), (2.00, .32, .24, .1),
], shirt)
for vertex in torso.data.vertices:
    vertex.co.z = .24+(vertex.co.z-.24)*1.12
collar = []
for j in range(48):
    t = math.tau*j/48
    collar.append((.325*math.sin(t), .10-.265*math.cos(t), 2.185-.052*math.cos(t)))
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
        finger = sphere('typing finger', (side*(.52+i*.105), -.84+(i%2)*.028, .434),
            (.043, .15, .043), skin, 20, 12)
        finger.rotation_euler[2] = side*-.18
    sphere('typing thumb', (side*.49, -.64, .433), (.058, .12, .054), skin, 20, 12)
    x = side*.69
    sphere('ear', (x, .025, 3.015), (.11, .14, .235), skin, 32, 24)
    sphere('ear inner bowl', (side*.752, -.052, 3.035), (.049, .064, .147), skin_shadow, 24, 16)
    curve('ear helix', [(side*.725,-.075,2.87,.6), (side*.796,-.039,2.99,1),
        (side*.782,-.01,3.17,1), (side*.714,-.065,3.20,.5)], .028, skin)
    sphere('ear tragus', (side*.720, -.107, 3.00), (.038, .035, .055), skin, 20, 12)
    sphere('nostril', (side*.100, face_y(side*.100, 2.963)-.008, 2.963), (.022, .010, .009), skin_shadow, 20, 12)

watch = curve('black watch strap', [(.89,-.63,.60),(.98,-.49,.48),
    (.94,-.56,.35),(.83,-.73,.45)], .033, black, True)
watch_face = sphere('black watch face', (.89, -.64, .609), (.12, .09, .029), frame, 32, 16)
sphere('watch glass', (.89, -.65, .633), (.093, .068, .008), black, 24, 12)

for x in (-.29, .29):
    vertices, faces = [], []
    rows, columns = 16, 40
    for i in range(rows + 1):
        v = -1+2*i/rows
        for j in range(columns + 1):
            u = -1+2*j/columns
            dx = .205*u
            opening = max(0, 1-u*u)**.72
            z = 3.24 + opening*(.092 if v > 0 else .062)*v + .012*u
            y = face_y(x+dx, z) - .008 - .035*opening*(1-v*v)
            vertices.append((x+dx, y, z))
    for i in range(rows):
        for j in range(columns):
            a = i*(columns+1)+j
            faces.append((a,a+1,a+columns+2,a+columns+1))
    mesh('almond shaped eye', vertices, faces, eye_white)
    y = face_y(x, 3.24)-.049
    sphere('hazel gray iris', (x, y, 3.243), (.073, .014, .073), iris, 32, 20)
    sphere('small pupil', (x, y-.014, 3.243), (.034, .007, .041), pupil, 24, 16)
    sphere('soft eye catchlight', (x-.021, y-.02, 3.274), (.015, .005, .013), white, 16, 10)
    for upper in (True, False):
        points = []
        for j in range(17):
            u = -1+2*j/16
            z = 3.24 + max(0,1-u*u)**.72*(.092 if upper else -.062)+.012*u
            points.append((x+.205*u, face_y(x+.205*u,z)-.012, z, .3+.7*math.sin(math.pi*j/16)))
        curve('upper eyelid' if upper else 'lower eyelid', points, .018 if upper else .012, skin)
    points = []
    for j in range(7):
        u = -1+2*j/6
        z = 3.435+.035*(1-u*u)-.022*u
        points.append((x+.21*u, face_y(x+.21*u,z)-.018, z, .2+.8*math.sin(math.pi*j/6)))
    curve('soft straight eyebrow', points, .020, brow)
    points = []
    for j in range(32):
        t = math.tau*j/32
        points.append((x+.262*math.cos(t), -.717+.030*abs(math.cos(t)), 3.18+.253*math.sin(t)))
    curve('round wire glasses', points, .0095, frame, True)
curve('wire glasses bridge', [(-.03,-.711,3.25), (0,-.748,3.266), (.03,-.711,3.25)], .010, frame)
for side in (-1, 1):
    curve('glasses temple', [(side*.55,-.692,3.24),(side*.675,-.40,3.25),
        (side*.73,.045,3.21),(side*.72,.12,3.08)], .0095, frame)
    sphere('glasses nose pad', (side*.075, -.695, 3.16), (.010,.008,.019), frame, 16, 10)

for upper in (True, False):
    vertices, faces = [], []
    for row in range(9):
        v = row/8
        for j in range(41):
            u = -1+2*j/40
            x = .225*u
            line = 2.733+.020*u*u+.007*u
            thickness = (.032+.011*math.exp(-((abs(u)-.29)/.2)**2)) if upper else -.040
            z = line + thickness*math.sin(math.pi*j/40)*v
            y = face_y(x,z)-.008-.017*math.sin(math.pi*v)*math.sin(math.pi*j/40)
            vertices.append((x,y,z))
    for row in range(8):
        for j in range(40):
            a = row*41+j
            faces.append((a,a+1,a+42,a+41))
    mesh('upper lip' if upper else 'lower lip', vertices, faces, lips)
curve('relaxed closed smile', [(x,face_y(x,2.733+.020*(x/.225)**2+.007*x/.225)-.012,
    2.733+.020*(x/.225)**2+.007*x/.225,.3+.7*math.sin(math.pi*j/12))
    for j in range(13) for x in [-.225+.45*j/12]], .006, lip_line)

def hair_surface(theta, phi, lift=0):
    sweep = theta - .82*math.sin(phi)*max(0,math.cos(theta))
    wave = .009*math.cos(theta*23+phi*5) + .0025*math.cos(theta*107+phi*15)
    radius = wave*math.sin(phi)+lift
    return ((.785+radius)*math.sin(phi)*math.sin(sweep)+.24*max(0,1-phi/1.5)**2,
        .10-(.755+radius)*math.sin(phi)*math.cos(sweep),
        3.43+(.81+radius)*math.cos(phi)-.14*max(0,-math.cos(theta))*math.sin(phi))


def hairline(theta):
    front=max(0,math.cos(theta))
    back=max(0,-math.cos(theta))
    return 1.94-.43*front+.63*back-.38*math.sin(theta)*front-.16*math.exp(-((theta-1.1)/.24)**2)+.028*math.cos(theta*19)


vertices, faces = [], []
rows, columns = 64, 128
for i in range(rows + 1):
    for j in range(columns):
        theta=math.tau*j/columns
        phi=.008+(hairline(theta)-.008)*i/rows
        vertices.append(hair_surface(theta,phi))
for i in range(rows):
    for j in range(columns):
        a=i*columns+j
        b=i*columns+(j+1)%columns
        faces.append((a,b,b+columns,a+columns))
faces.extend([tuple(reversed(range(columns))),tuple(rows*columns+j for j in range(columns))])
cap=mesh('Maksym swept layered hairstyle',vertices,faces,hair)
hair_mat=material('ash blond with brown roots',(1,1,1),roughness=.62)
cap.data.materials[0]=hair_mat
colors=cap.data.color_attributes.new(name='HairTone',type='FLOAT_COLOR',domain='POINT')
for index,color in enumerate(colors.data):
    i,j=divmod(index,columns)
    theta=math.tau*j/columns
    phi=.008+(hairline(theta)-.008)*i/rows
    blonde=min(1,phi/.85)*(.78+.16*math.cos(theta*23+phi*5)+.05*math.cos(theta*107+phi*15))
    color.color=(.042+.22*blonde,.027+.16*blonde,.016+.082*blonde,1)
node=hair_mat.node_tree.nodes.new('ShaderNodeVertexColor')
node.layer_name='HairTone'
hair_mat.node_tree.links.new(node.outputs['Color'],hair_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
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
    export_apply=True,export_materials='EXPORT',export_normals=True,export_texcoords=False,
    export_cameras=False,export_lights=False,export_animations=False,export_yup=True)
