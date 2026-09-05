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


skin = material('warm porcelain skin', (.72, .43, .26), roughness=.48)
skin_shadow = material('warm eyelid crease', (.38, .17, .095), roughness=.6)
lips = material('soft smile', (.36, .13, .065), roughness=.55)
hair = material('ash blonde sculpted hair', (.43, .29, .135), roughness=.4)
brow = material('soft brown eyebrows', (.14, .09, .045), roughness=.75)
shirt = material('slate blue cotton', (.055, .13, .23), roughness=.85)
seam = material('shirt stitching', (.08, .18, .30), roughness=.85)
silver = material('satin aluminum', (.34, .37, .40), metallic=.65, roughness=.28)
frame = material('brushed graphite glasses', (.16, .20, .21), metallic=.5, roughness=.3)
white = material('ceramic white', (.94, .95, .94), roughness=.24)
eye_white = material('warm eye whites', (.90, .91, .88), roughness=.22)
iris_edge = material('iris limbal ring', (.028, .068, .079), roughness=.25)
iris = material('gray blue iris', (.12, .26, .30), roughness=.28)
iris_inner = material('iris inner blue', (.075, .15, .17), roughness=.28)
pupil = material('glossy pupils', (.004, .008, .01), roughness=.12)
black = material('keyboard graphite', (.015, .02, .027), roughness=.48)
display = material('display glass', (.009, .018, .026), metallic=.12, roughness=.23)
code = material('display code', (.16, .41, .46), roughness=.5)
logo = material('white inlaid Apple logo', (.94, .95, .97), metallic=.08, roughness=.25)


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
    data.resolution_u = 10
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


def rings(name, levels, mat, count=64, subdivision=2):
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


rings('tailored shirt bust', [
    (.23, .86, .42, .10), (.26, .99, .46, .1), (.48, 1.06, .5, .11),
    (.92, 1.02, .46, .14), (1.27, .86, .37, .12),
    (1.47, .57, .31, .1), (1.52, .34, .25, .08),
], shirt)
sphere('neck', (0, .06, 1.6), (.30, .29, .44), skin)
head = rings('sculpted face', [
    (1.66, .2, .27, -.02), (1.71, .40, .41, -.02), (1.85, .61, .52, 0),
    (2.05, .76, .60, .015), (2.26, .86, .67, .03), (2.53, .87, .68, .035),
    (2.80, .89, .70, .035), (3.08, .87, .71, .04), (3.30, .72, .61, .05),
    (3.46, .43, .40, .06), (3.50, .08, .1, .06),
], skin)
parts = [head,
    sphere('nose bridge', (0, -.637, 2.40), (.115, .13, .29), skin),
    sphere('nose tip', (0, -.76, 2.23), (.145, .18, .12), skin),
    sphere('nose wing', (-.1, -.715, 2.20), (.078, .09, .065), skin),
    sphere('nose wing', (.1, -.715, 2.20), (.078, .09, .065), skin),
]
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = head
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join()
remesh = head.modifiers.new('blend facial anatomy', 'REMESH')
remesh.mode = 'VOXEL'
remesh.voxel_size = .024
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth = head.modifiers.new('soft facial transitions', 'SMOOTH')
smooth.factor = 1.1
smooth.iterations = 5
bpy.ops.object.modifier_apply(modifier=smooth.name)
reduction = head.modifiers.new('reduce face geometry', 'DECIMATE')
reduction.ratio = .5
bpy.ops.object.modifier_apply(modifier=reduction.name)
for polygon in head.data.polygons:
    polygon.use_smooth = True

for side in (-1, 1):
    x = side * .88
    ear = sphere('outer ear', (x, .0, 2.32), (.155, .115, .265), skin)
    ear.rotation_euler[1] = side * -.15
    sphere('ear concha', (x + side * .034, -.092, 2.32), (.082, .025, .155), skin_shadow)
    sphere('ear inner fold', (x + side * .04, -.12, 2.31), (.044, .028, .11), skin)
    sphere('AirPod bud', (x + side * .022, -.161, 2.29), (.065, .078, .105), white)
    stem = box('AirPod stem', (x + side * .035, -.168, 2.13), (.032, .038, .135), white, .03)
    stem.rotation_euler[1] = side * -.12
    sphere('AirPod microphone', (x + side * .052, -.179, 1.995), (.022, .025, .013), frame, 20, 12)

for x in (-.365, .365):
    sphere('almond eye', (x, -.545, 2.55), (.265, .13, .225), eye_white)
    sphere('iris outer rim', (x + .01, -.67, 2.55), (.153, .039, .17), iris_edge)
    sphere('iris color', (x + .01, -.705, 2.55), (.137, .018, .151), iris)
    sphere('iris center', (x + .01, -.72, 2.55), (.11, .011, .122), iris_inner)
    sphere('pupil', (x + .01, -.731, 2.55), (.086, .012, .10), pupil)
    sphere('eye catchlight', (x - .035, -.745, 2.616), (.039, .009, .042), white, 24, 16)
    sphere('eye small catchlight', (x + .049, -.741, 2.501), (.014, .005, .014), white, 16, 10)
    curve('upper eyelid', [(x-.26,-.55,2.55,.5),(x-.19,-.615,2.70,1),
        (x,-.64,2.775,1.25),(x+.19,-.615,2.70,1),(x+.26,-.55,2.55,.5)], .033, skin)
    curve('lower eyelid', [(x-.25,-.55,2.52,.5),(x-.17,-.60,2.38,1),
        (x,-.625,2.325,1),(x+.19,-.59,2.40,1),(x+.255,-.55,2.54,.5)], .016, skin)
    curve('eyebrow', [(x-.25,-.64,2.955,.25),(x-.12,-.695,3.015,1),
        (x+.06,-.70,3.025,1.05),(x+.24,-.64,2.98,.2)], .037, brow)
    points = []
    for j in range(16):
        t = math.tau * j / 16
        points.append((x+.322*math.cos(t), -.783+.023*abs(math.cos(t)), 2.55+.33*math.sin(t)))
    curve('thin rounded glasses', points, .022, frame, True)
curve('glasses bridge', [(-.048,-.776,2.62),(0,-.802,2.65),(.048,-.776,2.62)], .022, frame)
for side in (-1,1):
    curve('glasses temple', [(side*.686,-.76,2.65),(side*.83,-.43,2.66),
        (side*.915,.06,2.61),(side*.915,.14,2.43)], .022, frame)
curve('subtle smile', [(-.245,-.565,1.991,.15),(-.12,-.622,1.948,.8),
    (0,-.645,1.938,1),(.12,-.622,1.948,.8),(.245,-.565,1.991,.15)], .011, lips)

vertices, faces = [], []
rows, columns = 40, 112
for i in range(rows + 1):
    for j in range(columns):
        theta = math.tau * j / columns
        max_phi = 1.70 - .98 * max(0, math.cos(theta)) ** .5 + .62 * max(0, -math.cos(theta))
        phi = .012 + (max_phi - .012) * i / rows
        groove = .014 * math.sin(theta * 36 + phi * 18) * math.sin(phi)
        vertices.append(((1.005+groove)*math.sin(phi)*math.sin(theta),
            .06-(.855+groove)*math.sin(phi)*math.cos(theta),
            2.70+(.98+groove)*math.cos(phi)))
for i in range(rows):
    for j in range(columns):
        a = i * columns + j
        b = i * columns + (j+1) % columns
        faces.append((a,b,b+columns,a+columns))
faces.append(tuple(rows * columns + j for j in reversed(range(columns))))
mesh('continuous sculpted hair cap', vertices, faces, hair)


def swept_lock(name, controls, widths, depths):
    vertices, faces = [], []
    steps, sides = 64, 32
    controls = [Vector(p) for p in controls]
    def sample(t):
        t = min(t, .999999) * (len(controls)-1)
        i = int(t)
        u = t-i
        p0, p1 = controls[max(0,i-1)], controls[i]
        p2, p3 = controls[i+1], controls[min(len(controls)-1,i+2)]
        center = .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
        width = widths[i]*(1-u)+widths[i+1]*u
        depth = depths[i]*(1-u)+depths[i+1]*u
        return center, width, depth
    for i in range(steps+1):
        t = i/steps
        center, width, depth = sample(t)
        tangent = (sample(min(1,t+.002))[0]-sample(max(0,t-.002))[0]).normalized()
        normal = Vector((-tangent.z, 0, tangent.x)).normalized()
        for j in range(sides):
            theta = math.tau*j/sides
            groove = 1+.032*math.cos(theta*12 + t*3)
            point = center + normal * (math.cos(theta)*width*groove) + Vector((0,math.sin(theta)*depth*groove,0))
            vertices.append(point)
    for i in range(steps):
        for j in range(sides):
            a=i*sides+j; b=i*sides+(j+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))), tuple(steps*sides+j for j in range(sides))])
    return mesh(name, vertices, faces, hair)


swept_lock('swept blond quiff', [(-.67,-.28,3.1),(-.61,-.20,3.50),(-.12,-.22,3.70),
    (.43,-.34,3.61),(.83,-.48,3.43),(1.04,-.49,3.49)],
    [.06,.22,.24,.20,.12,.007], [.38,.60,.65,.56,.31,.02])


for side in (-1,1):
    sleeve = sphere('shirt upper sleeve', (side*.94,.08,.98), (.29,.34,.57), shirt)
    sleeve.rotation_euler[1] = side * -.25
    forearm = sphere('bent sleeve', (side*.98,-.28,.48), (.27,.48,.24), shirt)
    forearm.rotation_euler[2] = side * -.33
    curve('sleeve cuff', [(side*.77,-.65,.59),(side*.92,-.62,.68),(side*1.09,-.54,.59)], .015, seam)
    sphere('typing palm', (side*.66,-.73,.47), (.22,.22,.095), skin)
    for i in range(4):
        finger = sphere('typing finger', (side*(.49+i*.105),-.90+(i%2)*.035,.425), (.046,.16,.046), skin, 24, 16)
        finger.rotation_euler[2] = side * -.18
    sphere('thumb', (side*.43,-.70,.43), (.065,.13,.065), skin, 24, 16)
    mesh('folded shirt collar', [(side*.19,-.24,1.61),(side*.39,-.32,1.43),
        (side*.23,-.43,1.20),(side*.10,-.32,1.38)], [(0,1,2,3)], shirt)

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
box('retina display', (0,-1.244,1.193), (1.024,.003,.784), display, .021)
for row in range(9):
    offset = .14 if row % 3 == 1 else 0
    curve('editor line', [(-.84+offset,-1.237,1.52-row*.11),(-.22+(row%4)*.19,-1.237,1.52-row*.11)], .006, code)
sphere('webcam', (0,-1.235,1.996), (.012,.004,.012), frame, 16, 10)

# A filled silhouette keeps the bitten edge and detached leaf visible at hero size.
apple_outline = [
    (.002,.13),(-.065,.16),(-.128,.15),(-.169,.113),(-.19,.05),(-.182,-.033),
    (-.14,-.125),(-.10,-.162),(-.06,-.168),(-.006,-.149),(.046,-.166),
    (.086,-.154),(.135,-.105),(.163,-.046),(.120,-.014),(.107,.027),
    (.12,.071),(.153,.097),(.12,.139),(.061,.159),(.002,.13),
]
leaf_outline = [(.015,.177),(.032,.227),(.079,.261),(.118,.264),(.113,.22),(.074,.177),(.015,.177)]
for name, outline in [('Apple bitten silhouette',apple_outline),('Apple detached leaf',leaf_outline)]:
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
    obj.location=(0,-1.347,1.19)
    obj.data.materials.append(logo)

def blend_parts(names, name, voxel):
    bpy.ops.object.select_all(action='DESELECT')
    objects = [obj for obj in bpy.context.scene.objects if any(obj.name.startswith(prefix) for prefix in names)]
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    modifier = obj.modifiers.new('join sculpted surfaces', 'REMESH')
    modifier.mode = 'VOXEL'
    modifier.voxel_size = voxel
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    modifier = obj.modifiers.new('relax seams', 'SMOOTH')
    modifier.factor = 1
    modifier.iterations = 4
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    modifier = obj.modifiers.new('reduce export geometry', 'DECIMATE')
    modifier.ratio = .28
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


blend_parts(['continuous sculpted hair cap','swept blond quiff'], 'sculpted swept hairstyle', .018)
blend_parts(['tailored shirt bust','shirt upper sleeve','bent sleeve'], 'continuous cotton shirt', .024)

for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('MacBook thin lid', 'display black bezel', 'retina display', 'editor line', 'webcam', 'Apple ')):
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
bpy.ops.object.camera_add(location=(.4,-10,3.2))
scene.camera=bpy.context.object
track(scene.camera,(0,-.3,2.03))
scene.camera.data.type='ORTHO'
scene.camera.data.ortho_scale=4.45
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
