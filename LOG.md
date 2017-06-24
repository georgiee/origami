## 170624 - Part 2
I have the idea to make the current appearance an editor view
and to extarct or wrap the other parts (aka runtime) to use it in other contexts.

I'm not sure about the final product but let's see.

## 170624 - Part 1
Ok back to the foldingpoints thingy.
Recap: Flaps in the rose are sometimes rotated in the opposite direction.
Analysis so far:
+ Phi✅
+ Selection✅
+ Foldingpoints✅
+ Rotation Axis👎

Rotation Axis calculation wrong (surprise surprise) as the farpoint is picked wrong.

Mine is Index 106 with value of (151,200,0)
Java's one is Index 97 with value of (200, 151, 0).

Is 200 vs 151 just a coincidence or are we back at some precision problems
so that my pair has a different distance than the Java's one. Because the farpoint is calculated by distance and I can imagine that my point is really the farpoint with a difference of some very small numbers. Let's see.


Oh I'm confused. I thought I was looking at step 19-20
but the wrong -24 for z comes into play with step 17/18 🙄

Ok so that's the analysis log which shows the error:

```
1. test farpoint with distance: 0 and maxDistance: 0

2. test farpoint with distance: 34.448797437084735 and maxDistance: 0
--> new farpoint Vector3 {x: 200, y: 151.28204345703125, z: 0} 97

3. test farpoint with distance: 34.448797437084714 and maxDistance: 34.448797437084735
4. test farpoint with distance: 0 and maxDistance: 34.448797437084735

5. test farpoint with distance: 34.44879743708478 and maxDistance: 34.448797437084735
--> new farpoint Vector3 {x: 151.28204345703122, y: 200.00000000000003, z: 0} 106

6. test farpoint with distance: 34.44879743708476 and maxDistance: 34.44879743708478
```

Test Nr. 2 is good. That's the result I expect as the Java version has the same.
Test Nr. 5 is the bad one. Why does this slip through?
Apparently because 34.44879743708478 is larger than 34.448797437084735

Yes it is by -4.263256414560601e-14

So, mathematically ok. But I want the same result as the Java version which gets this distances for the involved points:
```

96 -> 96 : 0
97 -> 96: 34.448797437084735
99 -> 96: 34.448797437084735
105 -> 96: 0
106 -> 96: 34.448797437084735
109 -> 96: 34.448797437084735

vs my list
96 -> 96: 0
97 -> 96: 34.448797437084735
99 -> 96: 34.448797437084714
105 -> 96: 0
106 -> 96: 34.44879743708478
109 -> 96: 34.44879743708476

Reason for the 99/96 difference is this:
Mine: 99 =
x:199.99999999999997,
y:151.28204345703125,
z:0

Java: 99 =
0 = 200.0
1 = 151.28204345703125
2 = 0.0

Both, 96:
x:175.64102172851562,
y:175.64102172851562,
z:0

What happens is this:
Java:
(200.0 - 175.64102172851562), (151.28204345703125 - 175.64102172851562), (0.0 - 0.0)
to form the new vector: between the points:
(24.358978271484375, -24.358978271484375, 0) which yields to the length of
34.448797437084735

Mine:
(199.99999999999997 - 175.64102172851562), (151.28204345703125 - 175.64102172851562), (0.0 - 0.0)
to form the new vector: between the points:
(24.358978271484375, -24.358978271484375, 0) which yields to the length of
34.448797437084714

```

So at some point I got 199.99999999999997 for the x component of point 99.
let's look at the vertices list for both form the beginning.

I'm asking myself why I'm doing this. But I think the precision problem exists for both JavaScript and Java doesn't it ?

So on the first step I already hit this:
```

Mine:
200.00000000000003 200.00000000000003 0

Java
200.0 200.0 0.0

```
If both languages behave the same on my system I think I can find the place where this happens.
I use threejs and maybe there are some additional or less things calculated so that the numbers diverse? We are looking at the cutting and reflection methods.


My version:
```
In comes this:
Vertex is: (0,0,0)
Plane (not normalized to compare but it's actually normalized);
Plane: coplanar: 100,100,0 normal: -100,-100,0
```

In Java we see the same values coming in,
but other results. I am now looking at my code and see that I already messed with
the reflection operation and created a direct port of the reflection algorithm from
the Java sources - which uses the raw plane parameters instead of the normalized one. I quickly activate this method. And guess what? Same vertex in result.

I create it on day 170612, 12 days ago where I discovered that the plane values where wrong coming from my conversion script. This distracted me from the effects of my new reflection method.

I quickly enabled my `fix`. Two of three flaps are good now. One not. Really? What else could be wrong... It's step 21/22.

Let's look at the vertices on step 21.

Vertex 6 & 7 are different.
6: 200 199.99999999999994 0
7: 200.00000000000006 200 0

in Java both are 200, 200, 0
Let's go back to where those are modified. Maybe I can replace another function to use the not normalize plane parameters. And indeed I still have the reflect with polygon index using the old method. Let's try.

 No didn't help.

 I see those values appear in step 2 & 3 already.
 So let's look at step 2.

 400 199.99999999999994 0

 This actually comes from the cut operation. So I close the reflection case for now.

 I see just now I alos have a plain math function already in place there too.
 plainMath.linePlaneIntersection. Maybe I already fixed it there too? It's uncommented so let's activate it.

Oh boy, I am looking at this:
```
meet Vector3 {x: 400, y: 199.99999999999994, z: 0} meet2 (3) [400, 200, 0]
```
meet2 is the result form the ported algorithm. Let's see what happens.

I did not expect this: It gets worse. Now 4 flaps on the wrong side.

Stpe 1 shows me those new vertices from the cut - they were good before

```
4: 200.00000000000006 0 0
5: 0 200.00000000000006 0
```

+ (0,0,0) comes in
+ Plane is as follows: (100,100,0), (-100,-100,0)
+ Inside my ported `line_plane_intersection` is see a normalized normal. Shouldn't be here.

I fixed this part of my code- wasn't using any of the raw data. Stupid me, as it's the file where I collect exactly those functions.

```
// const pnormal = plane.normal.toArray();
// const ppoint = plane.coplanarPoint().toArray();

const pnormal = rawPlaneData.normal.toArray();
const ppoint = rawPlaneData.coplanar.toArray();
```

I now run the full playbook again. And.

🎉🎉🎉🎉 DONE.
Phewww. I couldn't debug that rose model any longer


I quickly check the other models. My heart dropped as many weren't working
but I quickly recognized that I changed something on my playbook in the past hour that could have caused this. Reverting the change fixes them.
I actually wanted to to some incremental building in the playbook, at least when going forward. At the moment I just re-run  everything when I change the step.

So nbew models working with this fix are:
+ Rose
+ Table (I never saw the legs)
+ Chair ( One part didn't rotate out)
+ Sanbow ( Many parts weren't rotated out)
+ Helicopter (was in my broken list, can't remember why)
+ Pelican (Was wrongly folded but recognizable before)
+ Glynn Box
+ Kabuto
+ Kazaribox
+ Masubox
+ Owl

😍 This is freaking awesome 😍
With this update I have now 30 models working.
Three are left to fix, four are excluded as they are not based on square paper

The three to fix are:
Lily, Phoenix and Omegastar

Omegastar has 127 steps, Phoenix 63 and the Lily 55.
The omegstar looks very bad, phoenix has still the tail wrong and the lily is only missing one of four petals correctly rotated. Let's see.

Step 52-53 is missing the third petal. The fourth is good again.

FOLD_REFLECTION_P on polygon index 54 don't do anything.

This time I'm debugging the reflection with a polygin index. This is easier than the folding. So as it's a index based operation check the selection. I get the list:

54. Period. Little small. Let's see what we should really get.

Hmm somehow that polygon index is not appearing in Java but other's that I don't have and I wonder what is happening just now? Ok I can't even get the breakpoints working for the fiel reading operation. Time to stop. At least with this part.


I will now look into the rendering and audio or do some refactoring. Basically relaxing compared to the madness I solved today 🤓

## 170622
Long break after being busy in regular work and in analog life with learning Japanese and other stuff 🎎. Lucky me I have a carefully written log to get back into my project pretty easy.
Ok I'm now parallel debugging my own application vs. the Java application again. I placed some debug points around polygonIndex. That's the index where the models go into different destinations.

I see that the amount of folding points is the same, the collected indices of folding points is the same and well yeah event the max distance of all involved points is the same. This is a very good sign. I currentyl got the following output in the Java application.

```
polygonSelect: 123 [123, 5, 85, 89, 97, 99, 103, 109]
internalRotationFold: 123
collin: true 66.08730115834754
```

vs my browser output:
```
maxDistance 66.08730115834749 origami-shape.ts:205
collin false origami-shape.ts:206
```

This is amazing, because it shows that the whole foldingpoint and distance caluclation is totally fine. Something is wrong at the self collision test (collin flag).

🤓 BUG FIXED 🤓
Nailed it again.

My application before:
```
if (v1.dot(v2) > v3.length()) {
  collin = false;
  break;
}
```

Mine after:
```
if (v1.cross(v2).length() > v3.length()) {
  collin = false;
  break;
}
```

That's again just stupid. In the original java source it reads as vector_product and I somehow
thought it's the dot product. But it was the cross product of the two involved vectors. As the whle foldingpoint stuff never worked before (I never collected more than two points, see the days before) I never noticed that error. Fixed.

I immediately saw that this was the fix as my crane finally worked again after the backlash. I also tried the Phoenix but no luck. Some other bug is nested there. It's amazing how many bugs are in the code but despite of all this some models just work. Sure, sometimes they are just not calling the bugged functions or don't use the bugged numbers from a wrong conversion. But even with all the bugs I fixed some models still worked. Thank god because this was a huge motivation.
Okay. So now I commti this bug and have a glimpse on the Phoenix or maybe some other not working model. But I slowly reach the point where I can say to myself: Well done, building is done. The following points would be:

+ Start audio-reactive rendering ( I want this sooooo badly but I have discipline and want to fix the model stuff before 🙏)
+ Undo/Redo. At the moment I rely on prepared playbooks from the Java application. But to get serious with modelling, I really need undo/redo. Maybe with the command pattern or by using redux. Redux feels over engineered. But it is always so much fun 😍

Ok I'm looking at the rose model right now. There are some flaps missing still.
Step 17/18 is the first appearance of this effect but there are two more flaps in the wrong direction. Either another conversion error so that the angle is wrong in the beginning or some implementation thing. I have the hope that this is related to the Phoenix as he also shows signs of wrong direction folding. Let's see.

My app shows me the step in question with the following short information currently
```
FOLD_ROTATION_P 112 -135
```
Java says the same. So let's look into the folding operation and the plane involved.
Ok I just debugged 112. Every result is the same. So maybe it's upside down and I onnly have two correct results 😅 I check now polygon selection Nr. 121 between step 20/21.

So same angle of -135 in both applications.

Stats at step 20 are polygons 134/ vertices 122 for both.
Selection is also the same: 112, 97, 99, 105, 108, 111

Let's find the wrong vertex. It's the tip only so it's only one vertex.

Funny it's the very first vertex to rotate.
```
200, 200, 0 -> 158, 158, -24 //JS
200, 200, 0 -> 158, 158, +24 //Java
```

axis vs. dirvec)
dirvec has the following value: -24.359, 24.359, 0


axis is my internal name, value is (it's normalized but real values are mixeup too, and match the 24.359 values
0.7071067811865475, -0.7071067811865475, 0

The flags are mixed up.
So something is wrong with base point vs farpoint where the axis is calculated.
Farpoint is wrong. 200x151 vs 151x200. So it's mixeup already from the foldingpoints part?

Ok actually both of those points exist. But somehow the farpoint algorithm is picking the wrong
at this place:
```
foldingpoints.forEach((fp, index) => {
  ...
})
```
## 170613
Butterlfy Time.

Fold Rotation foldingpoints algorithm always returned a single foldingpoint.
Now angle is not correct. 106 where it should be -150. I bet my conversion script again 🤓
YES! Again some stupid error. I read the appropriate part of the command header with ruby `c` instead of `C`
which reads it signed instead of unsigned. Event that I need it signed the sign is encoded in the command flag not the angle itself.
Fixed! Got the butterlfy working! And the pigeon! And the seahorse! And the fortune! And the frog! And and, I think I have now over 18 working models and only today I could add more than 5 because of the foldingpoint fix.

Buuut there is one gotcha. When I add the fix the crane's wings are not folded correctly anymore.
I will monitor the folding method when doing the crane to debug it.


## 170612
Ok, lets make a party with the numbers. I am at step 4/11 of the birdbase which precedes the crane so it is the same problem but with few numbers. I have the same polygon count and indices structure. But my vertices are off.

My vertices:

```
model.ts:24 0: -0.4889242561108683 1.1824076233992675 0
model.ts:24 1: -0.4889242561108683 1.1824076233992675 0
model.ts:24 2: -0.48892425611094875 1.1824076233992675 0
model.ts:24 3: -0.4889242561108683 1.1824076233992675 0
model.ts:24 4: 141.10490406730753 142.43108117723594 0
model.ts:24 5: 200 200 0
model.ts:24 6: 141.10490406730753 142.43108117723594 0
model.ts:24 7: -2.8421709430404e-14 199.99999999999997 0
model.ts:24 8: 0 200 0
model.ts:24 9: 200 83.39206939206366 0
model.ts:24 10: 200 83.39206939206368 0
```

Java vertices:
```
vertex 0: -0.17282384728231767 0.41723367031505054 0.0
vertex 1: -0.17282384728231767 0.41723367031505054 0.0
vertex 2: -0.17282384728231767 0.41723367031505054 0.0
vertex 3: -0.17282384728231767 0.41723367031505054 0.0
vertex 4: 141.24853102498457 141.83859127266714 0.0
vertex 5: 200.0 200.0 0.0
vertex 6: 141.24853102498457 141.83859127266714 0.0
vertex 7: 0.0 200.0 0.0
vertex 8: 0.0 200.0 0.0
vertex 9: 200.0 83.08712343182636 0.0
vertex 10: 200.0 83.08712343182636 0.0
```
`-0.17282384728231767` vs `-0.4889242561108683`  common ?

So pretty annoying differences already at step 4, this will sum up fast and I don't wonder anymore why polygons and vertices are so different in later steps. What about steps 1-3. i can show you with step 3:

My set of vertices:

```
model.ts:24 1: 0: 0 0 0
model.ts:24 1: 0 0 0
model.ts:24 2: -5.684341886080802e-14 -5.684341886080802e-14 0
model.ts:24 3: 0 0 0
model.ts:24 4: 200 -2.8421709430404004e-14 0
model.ts:24 5: 200 200 0
model.ts:24 6: 200 0 0
model.ts:24 7: -2.8421709430404e-14 199.99999999999997 0
model.ts:24 8: 0 200 0
```

Java's set of vertices:
```
vertex 0: 0.0 0.0 0.0
vertex 1: 0.0 0.0 0.0
vertex 2: 0.0 0.0 0.0
vertex 3: 0.0 0.0 0.0
vertex 4: 200.0 0.0 0.0
vertex 5: 200.0 200.0 0.0
vertex 6: 200.0 0.0 0.0
vertex 7: 0.0 200.0 0.0
vertex 8: 0.0 200.0 0.0
```

Ok. Let's see how to fix this. Maybe introduce a general less precision, so everythign smaller than 0.0000001 is 0 ?
I mean I have there numbers like -2.8421709430404e-14. That's ridic. I just looked into tje java sources and I found the part with the number compression. But it's only used for the preview, so it's not the source the my differences. I will now look into the calculations. My plane is normalized. The plane in the java application. That might be a good reason as my numbers get very small because of the normalization. Abd we are talking only about three reflection steps. Let's go back to step 1. The very first reflection.

My set:
```
0: 0: 0 0 0
1: 400 0 0
2: -5.684341886080802e-14 -5.684341886080802e-14 0
3: 0 400 0
```
Java's set:
```
0: 0: 0 0 0
1: 400 0 0
2: 0 0 0
3: 0 400 0
```

And there is not even a cut happening. It's just the reflection.

input:
vertex = Vector3 {x: 400, y: 400, z: 0},
projected/basepoint calculated {x: 199.99999999999997, y: 199.99999999999997, z: -0}
(calculated with three's plane through `plane.projectPoint(vertex)`)
result:
-5.684341886080802e-14, -5.684341886080802e-14, 0

plane:
normal: 0.7071067811865476, 0.7071067811865476, 0
cosntant: -282.842712474619

Proejction is one with this in three:
```
    var perpendicularMagnitude = this.distanceToPoint( point );
		var result = optionalTarget || new Vector3();
		return result.copy( this.normal ).multiplyScalar( perpendicularMagnitude );
```

java is doing this:


```
  double[] basepoint = line_plane_intersection(v, pnormal, ppoint, pnormal);
  return sum(basepoint, vector(basepoint, v));
```

```
static public double[] line_plane_intersection(double[] lpoint, double[] ldir, double[] ppoint, double[] pnormal) {

        double D = ppoint[0] * pnormal[0] + ppoint[1] * pnormal[1] + ppoint[2] * pnormal[2];

        double X = lpoint[0];
        double Y = lpoint[1];
        double Z = lpoint[2];
        double U = ldir[0];
        double V = ldir[1];
        double W = ldir[2];
        double A = pnormal[0];
        double B = pnormal[1];
        double C = pnormal[2];
        double t = -(A * X + B * Y + C * Z - D) / (A * U + B * V + C * W);

        return new double[]{X + t * U, Y + t * V, Z + t * W};
    }
```

So I will try the following:
Maintain the original, non normalized plane and use the plain algorithms from java. My
goal was to use the normalized and threejs way until now. But regarding the playback of the java folding rules it might be better using the plain algorithms.


1. Result
basepoint with the same algorithm but the normalized plane:
200.00000000000006, 200.00000000000006, 0

2. Raw Plane Data.
By providing the raw non-normalized plane data in the same function I get 200, 200, 0
Surprise, suprise. I mean the normale is (200,200,0) instead of 0.7071067811865476. So no wonder 🙄

I will plug in this function for the reflection, and I will do the same for finding the intersection of a plane and a polygon line in the cutting function. Maybe that helps.

Reflection: Worked.

Next challenge cut:
I want to get to -0.17282384728231767  instead of  -0.48892425611086665

I have a first not so round meet point 83.39206939206368 vs 83.08712343182636

And a plane with this
"ppoint": [ 141.00421142578125, 58.99737548828125, 0],
"pnormal": [ 141.00421142578125, -341.00262451171875, 0 ]



Ah really??
The input data already differs:
My json

```
"command": "FOLD_REFLECTION",
"ppoint": [
    141.00421142578125,
    58.99737548828125,
    0
],
"pnormal": [
    141.00421142578125,
    -341.00262451171875,
    0
]
```

internal numbers of java:

 0 = 141.33494567871094
 1 = 58.787261962890625
 2 = 0.0
pnormal = {double[3]@3016}
 0 = 141.33494567871094
 1 = -341.2127380371094


No wonder it won't align. So back to my conversion scripts. And this time I have the java sources running - which I didn't bother to do so before.
I will process birdbase.ori. I see the same numbers in the java IO (OrigamiIO#read_gen2 > Origami#addCommand)

Youuuuu nifty little bug 👹.

I found one in my conversion script by comparing every byte with the java IO processing.
I found that I forgot to shift the fraction part. So instead of a base integer value of  21951 I only had 276 which makes a huge difference even when transformed into the fraction part of a number.

So this is wrong:

```
frac =  (values[2]) + values[3]
```

this is correct within my conversion script. I will convert all again. My convert-all.sh script is already paing off 🤓
```
frac =  (values[2] << 8) + values[3]
```


😃😃😃😃😃😃
Ohhhhhh my god.
😃😃😃😃😃😃

Yes I still get some models with polygon index errors.
But I have the crane working and also the mouse.
194/123 vs 194/123
(yes totally the same now)

The last created polygon has the same indices,
The last created vertex looks like this
mine: 214.72179188021966 18.172396704381896 0
theirs: 214.72179188021966 18.172396704381896 0

This is freaking awesome. It proves that my algorithms are pretty solid.
I now have to find out why so many other origami figures have index errors.

I quickly looked into the butterfly. Step 19/32 to 20/32.
It's the first flap at the back rotated down. So we have a crease (at 19) and a fold rotation with index (at 20).
But nothing gets rotated even it gets rotated in the java version. Excellent point to investigate.

## 170611
That airplane nearly worked when I put in the values of a DIN A4 paper. only the tip was somehow off. But I don't care. I focus on the square so I want to use a square example to check and fix
my algorithms. By the way so far working (maybe among others, but those are the ones I know of)

+ Pinwheel
+ Catamaran
+ Miura
+ Boat

I will now check the butterlfy step by step. I will use my shiny new debug function (Key D) together with the diagnostics of the Java application.
To output my vertices and polygons I use `console.group` which makes it very comfortable to look at.

Analysis of the butterlfy. First of all I get an polygonIndex out of range error from my code. This means my internal polygon/vertices structure is off. The given playbook tries to select a non existing polygon. Happens at 27/32. So I will start my analysis around there. We are talking about 67 Polygons and 178 Vertices in my code to check 🤓 But first I really had to display the current step in the java timeline slider so I can finally see (step/total step) and don't have to count all the time as this gets ridiculous when looking at 30+ steps.

After looking at the butterfly I quickly decided to search for another not working model with a little less steps and vertices. I wanted to try the whale. But includes cutting which I don't support and never want to as it's against the origami thinking for me. That whale bugged me already in real life when I was supposed to cut it 😤 Ok next: FishBase. Don't work. Why? It's so few steps and still?
I quickly look into the extracted json and see a mutilation fold. Which must be wrong. Maybe V1 File Format error? I always ignored that. Back to the ruby files for a moment. Pheww.

Ok, in my ruby convert script I always expected a paper color block. That was missing for the fishbase. I will now regenerate all models and check if there a differences. I found exactly three: all of them are bases. Updated and inserted. Fishbase is working now.

I checked some models. Crown is small. I test with that now.

Analysis:
32/47 vs 28/37 so somehow I get 4 more polygons. Let's check where.
+ Step 1/7 (FOLD_ROTATION): Same.
+ Step 2/7 (FOLD_ROTATION): Same.
+ Step 3/7 (FOLD_REFLECTION): Same. Only the rendering is off. My double material is only displayed one one side.
+ Step 4/7 (FOLD_REFLECTION): Nice still the same
+ Step 5/7 (FOLD_REFLECTION): 13/22 vs 15/18. So I have two polygons less?

Ok two things to fix before I continue: Rendering &then the polygon difference.
The rendering is caused by my lack of the function `isStrictlyNonDegenerate` which is present in the original source when drawing. So let's check that out.

I implemented isStrictlyNonDegenerate and cross checked the results with the original source. It's fine. I also looked up some methods to calculate the area of polygons in 3d. That's a pretty nice [answer](https://stackoverflow.com/questions/12642256/python-find-area-of-polygon-from-xyz-coordinates) but I choose not to implement it yet as the current function works just fine.

Another problem the came to me when doing this: The triangulation I currently use is not suitable for 3d polygons. It is implemented within ThreeJS's ShapeUtils
triangualte function. Internally it using a 2d area function to determine if the verts are CCW as the algorithm depends on it. Additionally I doubt that the whole triangulation is working for 3d polygons as the internal snip function also drops the z coordinates.

The original java source uses a simple canvas projection of the polygon. So no help. all of my polygons are in the same plane, but it's not the XY Plane,
so I think I have to get the normal of the polygon plane (I just feed them into a plane to do so) and rotate them into the XY-Plane. I can now do the triangulation
and if this works I can rotate the result back into the old position. Sounds like a plane?
Steps:
1. Calculate Polygon Normal
Use [Newell's method](https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal) to extend the triangle normal calculation to a polygon
2. Rotate plane to the XY-Plane
https://math.stackexchange.com/questions/1167717/transform-a-plane-to-the-xy-plane (phew)
https://stackoverflow.com/a/19215137 (lloks good, gl based, doing the same thing as I)

3. Tesselate
4. Inverse Rotate the plane


**Got this nailed!🙏**
Astonishing exactly as I thought. Rotate on XY, tesselate. But I don't event need to rotate back as I only need the indices- as the algorithm is not creating any new vertices (like delaunay would do if I read that correctly).
I now integrated the triangulation into the polygon oyt of the mesh.

THis yields to two new working figures:
+ Waterbomb
+ Crown.

Both had a render error but were correct otherwise as I could tell from the crease view.
Now back to the analysis of the vertices/poylgons.

> Reminder: Step 5/7 (FOLD_REFLECTION): 13/22 vs 15/18. So I have two polygons less?

Ok I looked into it. it's about the flaps of the box that are reflected into the box. I see a small gap. Nothing else. Could be a problem with the precision. My actual goal is to get the crane running properly. So I switch over to the analysis of that.

+ Step 3/23 is fine (6/9)
+ Step 4/23 is already off (12/17) vs (12/11). The crease pattern looks fine.
So maybe my tidyup function is not working?

Nope. I got a precision problem.
My function planeBetweenPoints2 uses the same epsilon as in he java source- but the calculation there is not normalized. So I guess I need to work on those numbers. I also have seen that the Java Application doesn't some internal rounding by using its own compression function. This reduces permanently precision and might help there for the overall precision thing? If I change the EPISLON, which stands for "0" to 1 in this calculation it works. for the given step. But this function is used in every cut so I might have some effects caused by this. So I have to be very carefully.

Well, no magic here. This is a problem but won't be fixed by just setting epsilon to 1. Which feels wrong anyway.

No precision! My between plane function was wrong
and also I didn't check if vertex2 is not the dividing plane.

But still. Now I have the same amount of polygons in step 4.
The vertices and somehow match. But I see significant differences liek this:

 ```
 // my vertex 0
 -0.4889242561108683 1.1824076233992675 0
 // vs java vertex 0
  -0.4889242561108683 1.1824076233992675 0
```
The polygon indices perfectly match now. So again: Precision problem. Next time I work on this.
At this point of time, it could be that everything is working actually and that I only waste time trying to get the existing folding sequences working - where I could create my own. So I might jsut try to build my own crane by applying the correct amounts. Next step from here would be my own history I can save or export. Aaaand before I do this I need an undo system before killing a model right before the completion 😅☝️

## 170610
Ok. I feel like I am late to the party. But today I recognized that the Java Origami App has an diagnostics mode
where I can output the vertices and polygons. I discovered this when I started it the first time in IntelliJ because I finally wanted to compare the internal data to my data.
Now I will compare the results of all my methods to original ones. I still need to set breakpoints in the Java source to see last cut polygon pairs and that all but ncie to know that the author even thought if this debug feature. But I just found a problem: It is only outputting the planar/2d vertices from the creasing pattern. I want to compare my real vertices in space. So that's the first customization I will do on the original origami code.

Results for the boat:

+ Step 1/9 (FOLD_REFLECTION) Ok that wasn't hart. Horizontal Reflect. Everything matches.
+ Step 2/9 (FOLD_REFLECTION) Bottom right corner to the center. Fine too. I only see a floating error at vertex 4.
+ Step 3/9 (FOLD_REFLECTION) Same with the left corner. Same rounding error there. Vertices Count, Polygon Indices, Everything matches.
+ Step 4/9 (FOLD_ROTATION) Yes. Same same.
+ Step 5/9 (CREASE). Creasing is on the outside border. So I didn't expect any new vertices and polygons. Let's see what happens. Creasing is changing the cut history.
+ Step 6/9 (FOLD_REFLECTION_P on index 5). here comes the difference. Well I already knew this. It's clearly visible in the UI that my app wasn't able to flip out the polygon in question. It just flipped everything.

Now I will examine step 5/9 and 6/9. I bet it's something with the polygon selection algorithm and maybe the innocent JS floating errors are the problem?
So what I alright knew: My selection selects everything, but it should only be vertices [5,7]. Alright let's go down the rabbit hole again. I will debug the select algorithm in both applications.

YES! Got it. I was too strict with my test if a vertex is on a plane inside the selection method.
```
  //old: if (Math.abs(distance) > 0.0001) {
  if (Math.abs(distance) > 1) {
    selection.push(i);
    break;
  }
```
Now I the boat is working. Next journey will be the butterly or airplane. Both are running through with no index error but the result looks off.
Let's start with the airplane.

Ok airplane done. Wrong paper format. But I will take this as a tet and put in the other paper format.


## 170605
Another day, another bug catched 🤓
Look at this:

```
 }else if (index){
  this.reflectIndex(plane || this.currentPlane, index);
}else{
```

Guess what happens when index is zero ? Yes it is not executed. Well known but I somehow got this into code. Time to use a linter even it is only a fun project.
After activation I fixed a zillion of linting errors for my main files. The rest will be fixed when I have to work on them. So finally no shadowed variable or wrong comparison errors.

After fixing this error which might have caused problems with other origami playbooks I run I will try some of them again. To do so I will finally integrate a selector in my debug panel.
To select existing or even paste new one. This helps during development.

One hour later: Done. Feels good.

I also flipped the camera to match the opengl environment where the playbooks come from. By doing this I look at the same side when playing the steps.
THis was as easy as changing the camera up vector in the three js camera.

Today I also converted all of the given *.ori files from the Java Sources to use them in the new dropdown to test any model at any point in time.

I fixed the debug panel for the playbook so next/prev are now always in bounds. Now I will finally fix are core problem: Reflecting of a selected polygon index
is not always working. Most of the time the problem is when I place the plane at borders and try to reflect back a polygon with lays on top of another polygon.
It's currently just flipping both. So maybe the crease immediately before or the select algorithm is wrong. I do't think that the reflection is wrokng as that thing is rather simple from an implementation perpsective. Let's see. I will give me one hour today to look into it.
Ok 1 hour later.
Result: I was distracted by WWDC, by Japanese Music I was searching for BUT I got somethign at least.
That boat which is not working straight from the decoded ori file is working when I align it and reflect the lower tip manually.
Within the #reflectIndex method I output the selection and see that the array is the same as if I would position the plane far outside of the whole object- which
would cause it just to flip as every polygon would be on one side of the plane. (these are the actual values: [6, 0, 1, 2, 3, 4, 5, 7])

If I do it manually I see two major differences: The selection shrinks: [10, 4] which is what I exptected as only the two polygons forming one side of the triangle should flip over.
And I can see in the creasing pattern a perfect red cross. Which outlines in combination with my selected polygon what will flip.
Take the dot I place on the polygon I want to select and in combination with the creasign preview (the red cross ) I see that my two expected polygons are enclosed.

I wonder what is the *perfect* way to align my object to the camera to get the proper plane. At the moment I align the two flaps as best as I can to the the proper angle to put generate my plane. Is it Neusis that could help here? Anyway. I call it a night for today.

## 170604
New day, new stupid bug. I am in the process of refactoring and want to put the cut method into a polygon class.
Process is good, it's a lot of cross testing to see if the results are the same as before without the parts ripped out of the shape class.

But I wasted an hour hunting down a bug where my vertices2d went crazy very early. I knew it
must be somtehing in the new Polygon class or Model Class where I manage all global vertices and polygons.
I created a new method amendVertices2d to update the 2d vertices for the creasing view in a separate function
instead of being baked in the cut method.
This method  defines `v1`, `v2` and `vertex2D_1`,`vertex2D_1`. Yeah stupid naming and that was the reason for the
bug. Those are retrieved from the global vertices array with index. Same index means same vertext in 3d and 2d.
I have the methods getVertex and getVertex2d in place to do so. Guess what? I retrieved both with getVertex2d. So it went nuts
pretty quickly. I had those errors. It is just because you're not focussed enough.


Aaaaaand there goes another. Looked like the bug before but happened only after 18 steps in the miura fold playbook.
I console logged the shit out of my application to find that innocent part:
```
    newpoly1.push(i);
    newpoly2.push(i);
```

which should be

```
    newpoly1.push(indices[i]);
    newpoly2.push(indices[i]);
```

So nearly same bug as before but other place in my code, same weirdness in the vertex2d but I did not even think of checking the indices at that place 🙄 Lession learned. Maybe.


Ok finished for now. I will continue on refactoring next time. It was straightforward once I had the model and polygon class in place.
I'm currently removing all calls accessing my raw vertices and polygon data and switching over to the wraped polygon class. This class holds everything needed for a single polygon (mostly data and degenerated checks). This helps me alot decoupling the different views and classes holdign the calculation power. After finishing it I will refactor the overall structure.
There are: Rulers, Mesh Views, Creasing Views, Shape, Model, Playbooks, Snapping, Debug Visualizer (Plane, mark Polygons and vertices)
and I want to decouple them so ideally I can use everything standalone. THis might help me existing in the future.

The last thing I did today was ordering two books to go further down the Origami Rabbit Hole 🙏
+ [Origami Design Secrets, Lang (Link affiliate)](http://amzn.to/2qXUUWk)
+ [Origami from Angelfish to Zen, Engel (Link affiliate)](http://amzn.to/2sJx6XD)

## 170603
Plan for today: Get the creasing preview done. Let's start.

Yes, after 2 hours I got it working on the creasing view. I don't know yet if I need a preview on the 3d yet.
But I frequently into problems with the indices based organziation of the polygons and vertices (this structure is good).
In my loops I frequently mix up indices of the current loop just pointing to the array and indices pointing to a vertex or polygon.

THis yielded into a stupid bug just now: I was iterating over the vertices of a given polygon. I had to check for the intersections between
the vertices and the plane. This worked but I quickly run into problems with multiple lines. First I blamed my mesh generating algorithm (so justa visual error) but I quickly discovered that some of the intersections were basically ok, but the involved vertices were part of two different polygons. The bug? Looks like this:

```
for( let i = 0, l = polygonIndices.length; i < l) {
  let currentIndex = polygonIndices[i]
  let followIndex = (currentIndex + 1) % vertices.length;
}
```

currentIndex and followIndex will hold the actual pointers to the vertices. To always get a pair I use modulo. But I use it on the wrong dimension. I should modulo the accessor of the `polygonIndices` array - otherwise I get some unrelated vertex not beloinging to the current polygon.

---
I started with the refactoring. Created a new model to hold my polygons, vertices and vertices2d. Nothing more.
I recognized that I created a polygonList to do the same before. But I rememeber that I introduced bugs with this so I just reverted everything. I must have forgotten that file. So now: More carefully working on this. My goal is to get a nice class compound to work with polygons & points. Both with indices and the actual value. I plan to try out some es6 generator patterns to easily loop over all or parts of them.

```
let followIndex = polygonIndices[(i + 1)%polygonIndices.length];
```
Bug fixed and I feel like a novice running into bugs like this. THis is a very clear sign that I'm not comfortable with the current structure of the code. This comes from porting code combine with my prototyping loving mind to get things running quickly. So I really need a very thorough refactor session soon to get things straight and readable.

## 170529
Ok I'm getting nowhere with my debugging. I tested some basic reflections within the state of the crane/bird base. Step 7. Reflecting one of the bird base legs.
It's polygon index 23 in the saved file. It's working then I play it with the playbook but when I do the same manually (select polygon 23, reflect in the same direction)
it is just flipping the whole origami. Which shouldn't happen when I flip only a specific polygon. So now I want to go further back. Let's build the bird base myself without relying on the given playbook. Steps 1-4 are easy. Step 5 isn't going to work. I'm missing some tool. My points only snap to half and thirds, but to get that side folded and aligned to the center I need some other ratio. I'm now thinking that `Angle bisector`, `Through 3` and `Neusis Mode` are not only for fun in the java application. I read the manual. And I have the strong feeling I'm missing the angle bisector. So back to the roots:

+ First of all it's annoying not to see what I'm doing, I need a preview in the creasing view what I'm going to crease/fold.
+ Second I need that bisector function.

Let's do that. I'm happy to have a clear task again because that blind debugging why seomthing is not working was really demotivating.

## 170525
Got that resizing working, tried out again RxJS to do so. Works pretty well. Throttled and providing initial value by using a BehaviorSubject.
I also added some validations to the ruler as it might be possible that there are empty endpoints when the raycast failed or the mouse simply didn't move.
I catch those errors now. I also moved back the main camera on the z axis as the value of 100 was to low- this caused failed raycasts on some sides of the origami.
It is now at `z=1000` instead of 100. Together with the size of 400 of the origami it's safe to assume that I will always get a raycast intersecting the scene. If not, well I handle errors now pretty well :)

Today I wanted to fix the camera thing. OrbitCamera lock the UP direction which is not so good for a origami tool where I want to watch and modify it from every possible direction. I already tried to do something about it in the past. Monkey patching OrbitControls to unlock the rotation (nope) or drop in the TrackballControls. But it wasn't that easy and my motivation for it wasn't high enough back then. So I reverted it. Today I tried it again with the TrackballControls. Once I understood how to control it with the keys A-S-D as toggles to hold for zooming (s), panning (d) and rotating (a) I found it really helpful.

I already patched the OrbitControls to get a proper moveTo function (to center my model) so I had to to the same here. This was straight forward. A adjusted some properties and made it moving statically as I don't need those damped movements of the camera. Result: Far better user experience with that camera. And I also have a superior pan handling compared to the OrbitControls. Together with the resizing, my shiny new crease view in the corner the whole application is beginning to feel very good. Love it!

Next things to fix: Still that tidy up stuff with the polygons. I postpone this frequently as I don't have a good measurement or goal yet.
So I have to browse the sources of the java application again to get an idea I guess.
---

Well I tried some things but the shrinks are not helping. Mayeb it's just fine. Because after giving up on the tidy up topic I tried once again
to get the crane working. Still the same error as the the polygon indices are not matching towards the end. So I played it back short before the moment
where it's not working and did it manually. And yeah it worked! Well not in the same way as the playbook suggests. With the bird base at hand I shoudl reflect the two legs up to get the tail and head. This is also how I know it from folding it with real paper. This works, but after that I need to fold the wings. And that should be straighforward: Align a plane, select one of the polygons on the wing and fold with that index. But it's not folding. This happens when the algorithm detects that it would actually tear the paper apart.
I tried different positions of my crease but it only works when I'm very high on the wings: The result is a crane with ridiculous short wings 😅 So I guess my reflection in the beginning is at the wrong position and yields into a overall structure where I can't fold my wings. But I got it working with another order of actions: First fold the things and then relfect the bird base legs. I don't know at the moment if this would work in reality but it works with my code. So first milestone reached: Get a crane working. Yeah 🙌.

After creasing and reflecting the bird legs it's not removing the unaffected polygons. This might be the reasons why I have so many polygons. Need to dig deeper here!
And I couldn't resist and digged for half an hour. I had plenty of creases call in my origami class which acts as an interface to the underlying shape class. Those creases emptied my cuttedPolygons Array where I keep track of the previously created polygons from creases. After a fold or reflection I can merge unaffected polygons. But if I call a crease with the same plane twice, guess what: This array was always empty. I fixed it and hoped to get a signifcant smaller amount of total polygons. But nope, stil around 180 for the crane and I don't know if this is the same amout as in the java application. Maybe I have to finally get that started in Eclipse or somewhere to get those numbers ?

But my creasing pattern looks different. Many creases are gone and it's now looking more like the one in the java application. That's good! But I can also see now
that something is wrong in step 12 (part of the bird base). The creasing pattern doesn't match when I fold in one side. This is somehow good, because it's a not so complex part of the origami and I can do some vertex/polygon debugging here eeasily. Hmm. When I disable the merging the pattern looks fine at the step

Some other things I notices:
Next things I could try - so plenty of work :)
1. Preview of my creasing/plane in the crease view. Yeah that is a must have.
2. Try to get the polygons in a binary tree. I could go back and forth in history with this without playing back the whole history.
3. z fighting is very visible. I have many meshes laying on top of each other (as I pretend to fold paper with no height). No chance to rework the algorithm but maybe something in the rendering or mesh construction ?
4. I use a very naive approach with multiple meshes to display different colors for back and forth. And with this I see some incorrect normals. My wings are supposed to show the same side of the paper and therefore point in the same direction. Can I fix this?
5. Think about animating from the paper to the final origami. Can I find some nice ways to interpolate between the steps. Do I need that, maybe it's looking okay? And I need to cache the resulting vertices for each step. It's not even worth to think about calcualting the steps on the fly.
6. Some undo easy handling without working on the binart tree stuff: I could simply save the whole state of the origami (vertices and polygons) and apply that state again.

## 170524
It's early in the morning and I finally fixed a bug with the normal creation together with a non-square orthographic world. I wanted the world to fill the full browser window. So I changed the width and height to match the browser window ratio. Previously it was just a square to make working with the orthographic world easier in the beginning.
This was fine until yesterday.

When I was drawing my 2d line with the mouse the resulting plane normal pointed in some direction that was slightly but visibly off the expected direction. This didn't happen when one of the 2d components was null (so straight lines vertical or horizontal worked). I immediately know that something was wrong with my normal calculation in the ruler.

So understand what's wrong here how I create the perpendicular line to my mouse drawn line:
startPoint and endPoint are 2d coordinates already in viewport coordinates (aka normalized device coordinates).
```
// this just maps to two points in 3d space by projecting the 2d version.
pStart = projectMouse(startPoint.x, startPoint.y);
pEnd = projectMouse(endPoint.x, endPoint.y);

// If we flip the 2d components before the projection (so we are still in the 2d coordinate system)
// we get the perpendicular line which we can then project again
pStartOrtho = projectMouse(-startPoint.y, startPoint.x);
pEndOrtho = projectMouse(-endPoint.y, endPoint.x);
```

That's straight forward. Nonetheless something was wrong here as the normal resulting from pStartOrtho and pEndOrtho
was clearly off. Did I mention that startPoint/endPoint are already in viewport space? So they are mapped to values
between -1 and 1 with 0,0 in the center. And that's the problem.

When I switch those already mapped components they don't match the orthographic world anymore. Because my world is wider than hight. So if I just change the 2d components it won't be perpendicular anymore due to the other mapping.

So quickly moved my conversion to viewport coords around. Instead of doing the conversion at the mouse input
I do it later so can reach the raw components of the mouse again. Now I had to remove the constrains of my viewport cords version which enforced values between -1 and 1 and voila it worked.

Now I have to refactor. I want the viewport conversion back at the mouse input. But I think I can
just convert back to screen coordinates at the normal calculation. But it was important to prove my thoughts about this and yeah still happy that it worked.


**OK PART2: Back from work after working on this in the morning:**
My goal for this evening is to create a separate view of the crease patter. Currently it is floating next to the 3d view. So if you rotate the camera,
the creases will rotate away. That's bad because it's an important part of interaction.
So the things to do are:
Firs of all. Decide if you want a html based view (a separate fixed canvas and whatever library I want to render the vertices2D and handle the interaction)
or integrate in threejs. I quickly concluded it's nothing complex, there are no buttons, no text (like in a HUD) so I really don't need the power of HTML/CSS.
So yeah go for threejs. This means the following:

+ Create a scissor test in the renderer to create a place where to render another scene with another camera
+ Create a separate camera and scene to hold the creasing view from now
+ Move it out of the origami
+ Adapt the mouse coordinates as our origin is now at the top left of our scissor test. Not top left of the window.
+ Adapt the mouse to device coordinate function. I had a raycast in place. But as I match the camera & rendering to the creasing width (at the moment 400 like the origami). I can just to x/400 y/400.
+ Refactor, so you can change the size of the rendering to any size while keeping the internal size of 400 which still matches the origami (why? Because all vertices2d of it are calculated with respect of the base origiami size)
+ DONE.

Yeah I have now a fixed view of the crease pattern with working interaction (to select polygons)

Next Tasks:<br>
I want to freely move the camera or at least recenter the origami.  It's not that easy, of course some calculations are going wild.
And I also want to finally get the cleanup and degeneration detection straight.

OK I monkey patched threejs orbit controls and created a moveTo function. It is only moving around x & y so I don't have to use lookAt which would interfere with
my normal plane calculations as it's modifying the normal of the camera in an unexpected way. Centering is okayish for now.

## 170523
5am, got up very early and had a stupid idea. Well the idea is good but I can handle such a problem in the morning. I changed the world to have different height and width (instead of being square) and now I have problems calculating the plane normal.

## 170522
Today I added some testing tools.
A new folder in dat gui to use the previously created playbook with a slider to jump to any given step.
I also extended the creases view to display a set of polygon indices for better debugging if a polygon if at the expected place
as I have still the problem that the polygon index from the external file format is not always matching with my set of polygons.

Result: I got the wonderful miura fold working today.
The last polygonIndex was wrong. It was 37 but in my set it was 52 - I concluded this by watching the very uniform pattern
together with the previous polygon indices. The polygon 37 was just on a very random place so I knew it was wrong. I picked
a more sane polygon - Nr. 52 - and the last two steps worked. Feels good to see my ported algorithms working.

Next challenge will be to optimize the cleanup process of degenerated polygons so it finally matches with
the file format and then I'm also sure that my cleanup is good enough for my own shapes and experiments.

## 170518
Finally got the number thing straight. I mean I always expected some overflowing integer but I couldn't get my head around how to reproduce it in ruby
without having a number example from java. Today I was in the mood to hack some java code together, outputting all the numbers at the command block section of the file format.

It's basically a signed short value overflow into negative values - where my ruby part never overflowed nor did my unpacking strategy
with different signed integer size get me anywhere. I think when I tried unpacking with bytes.unpack("@4cC3") I was really near.
I get a -2 instead of a 254 for example. But the thing is": short java unsigned has the range of -32,768 to 32,767.
This would mean I have to use the 16bit unpacking directive (S or s). But this would only mean that it is also expecting more bytes and not only the single byte I provide
per number. Solution: Just unpack the bytes as usual 8bit values unsigned and then do the overflowing manually.
That's the wonderful piece of overflowing in ruby I found. And now every number fits and I can go on applying all commands from the given file
inside my own web based origami application.

```
def force_overflow_signed(i)
  force_overflow_unsigned(i + 2**15) - 2**15
end

def force_overflow_unsigned(i)
  i % 2**16   # or equivalently: i & 0xffffffff
end
```

So and how does this work? Well the bird base just works!! This is an awesome feeling as it means my algorithms are just working very good to this point.
The only thing is: When I switch over to the crane playbook which is the bird base + crane specifics it fails at the moment where it tries to do a index based reflection.

This means: My indices are not the same as in the given file format (I think because I'm not tidying up empty polygons yet)
and even if I manually select the correct polygon index to reflect it is just doing nothing. So back to debug mode. But that's half of the fun isn't it ?! 🙌

Funny bug in `reflectIndex`. I don't break the inner loop over the selection.
So I basically search over every index. Then I iterate over the whole list of involved polygons (selected). if some of them contains the vertex
it's involved in the selected polygon folding action. But if I don't cancel the inner loop I immediately reflect my vertex back and nothing happens.
Stupid🤦‍♀️

Ok it seems that every base function (reflect, fold) is working now. Reading the existing save files form the other app works too
but the index still mismatch. I will look into this next time working on this. I'm eager to do so, because my UI sucks at the moment.
It is easier to use an existing set of folding commands instead of building my own set from my paper origami sources.

## 170516
Problem: NULL Error when raycasting. But only when I'm using the very large setup to match the 400x400 setup from the original sources.
Solution: Raycasting is using the camera position (as I set it with setFromCamera). In my setup the camera is at 100. So if I rotate the object
in front of the camera it is projected as usual but in reality it is behind the camera. It's not visible because of the orthographic camera.
Behind the camera means my ray shoots in the wrong direction.

I have to fix my camera distance (with z, no effect on the projection but clipping) or adjust the ray accordingly.

Things to do:
+ My polygons quickly degenerate (vertices reflected far away, non drawable triangles,). Maybe I forgot some checks?
+ I also found that shrinkWithIndex is not in use.
+ Show the (potential) folding line in the creasing pattern. Is there a shortcut by using the vertices2D or do I have to do a full (temporay) crease to find the folding line?
+ Check the file format with the bit float bit conversion again.
+ Fix the creasing view in a separate viewport with a separate camera.
+ Allow the camera to move without changing the result of the ruler. Currently the plane is misaligned then.
It's fine from the view of the camera, but wrong from the view of the origami - reflecting for example results in two sides not laying on each other liek usual.


commandBlock(int void, double[] ppoint, double[] pnormal, int polygonIndex, int phi) {
  is the place where the command is transformed to bytes. Might help with decoding.

## 170515
Too much Origami on the weekend. Eyes hurting.

## 170514
Debugging the new foldIndex function. It works but the merging of non affected polygons is somehow broken and merges the wrong polygons. Well in the creasing pattern (vertices2d)
it looks good but in the 3d view it just looks plain wrong.

Really? Really? Debugging for at least 6 hours and I found that I got the selecting algorithm wrong by a sign error.
if(Math.abs(distance) > 0.0001) vs if(Math.abs(distance) > 0.0001). Stupid but as it's working pretty solid now it's one of those lovely errors to find🙏

And I tried RxJS once again. Wanted to create a unique stream of vertices from grouped polygon indices [[0,1],[0,2]] -> [[1,2,3,4,5,6,7,8]].
But well like the thousand times before. RxJS is hard because you can't find the right operator without knowing the full set. Next time I get you rxjs.

Got back to the file parsing thing in ruby. I changed my origami setup to match the original java app (400 base width) so I can create a playbook system to run the files I parse.
Created a bunch of save testfiles with parts and coordinates I can easily check/reproduce in my application.

But there is something off with the conversion of the x,y,z numbers.
It's that part. Not really complicated. I already have my 4 * 8 bytes packages at hand to do the conversion but the numbers just don't match.
I guess it's a combination of me unpacking the bytes not correctly and the following part where some number constants are added (I believe to save some bytes)
when the plane parts (normal * coplanar) are constructed. We will see.


```
Xint = (short) cblock[++i];
Xint <<= 8;
Xint += cblock[++i];
Xfrac = cblock[++i];
Xfrac <<= 8;
Xfrac += cblock[++i];
double X = Xint + Math.signum(Xint) * (double) Xfrac / 256 / 256;
```

This is the part with the constants
```
ppoint[0] = (double) X + Origins[(((header >>> 24) % 32) - ((header >>> 24) % 8)) / 8][0];
        ppoint[1] = (double) Y + Origins[(((header >>> 24) % 32) - ((header >>> 24) % 8)) / 8][1];
        ppoint[2] = (double) Z + Origins[(((header >>> 24) % 32) - ((header >>> 24) % 8)) / 8][2];
```

get projection of 2d point on origami completed


## 170513
Finally got the commands from the original source converted. I save them to a json file for the moment. Have to figure out how to do folding and reflection on single polygons before using the given data. So that's what I am doing now. I wondered all the day why the internal fold with a polygonIndex doesn't seem to do any cuts. But hours later I recognized, it's creasing within the UI calling function just before calling the folding action (see OrigiamiScriptTerminal).

I also  put some efforts into creating a polygon list holding class to have vertices and polygons in one place instead of mixing them with the origami cutting logic.
Well I should have thought more over this. I wanted to gradually move over to this new data structure and therefore used it at some place. Stupid that that containsIndex()
to determine if a vertex is inside a polygon was not working as expected. I didn't thought of it so I spend far too much time finding that stupid error.
Learning of this: Do one thing and never do such a core functionality on the sideline.

## 170416 - 170513
I'm working on this since returning from the OFFF. My first commit is from April 16th. I spend the first days with googling
and finding some existing sources. There is just nothing. So I picked some existing scientific papers about origami and read them. Among all those papers there is one
that describes an application build in 1997 that does what I am working on. So it's my base of work. There basic data structure is a binary tree to follow the history of each vertex and polygon. This is appealing to me and I just start which this. I collect some vertices, edges and polygons in graphs. I'm figuring out how to cut them and spend several nights doing so. After 2 weeks I got nowhere but had fun with data structures. While thinking about the data structure and some random place outside of my home I thought maybe I missed something in the web. So I googled again. And I found something. A java application. As I wasn't home I couldn't check it out but I saved the link. When I came home late I immediately checked the website. I found a sourceforge link. And some sources. I started the included jar file and to my surprise I found a wonderful Origami designer in 3D written in Java - aaaand I had the sources at hand. This was my beginning. I threw everything aboard and started new. Created another THREE basic world where I can test my meshes. I loved the graph idea but postponed that for the moment. The application  at hand uses the undo/redo pattern by using actions instead of graphs.

My new approach: polygons and vertices based on indices and a ruler to get the cutting plane. The cutting plane in space is new. I was so much focused on reading the scientific papers that I totally missed the obvious. And now that application is doing it. Create a plane in space and cut the exiting polygon with it. I could totally use the three js cutting functionality but I want so stick to the basics and also to the given sources. So I create polygon cutting functions from scratch. By looking at the sources, at wikipedia, at other repositories and by looking through my books at home. This is just fun and I spend so many evenings and every time I am on a train doing so that I reach fairly quickly a point where I can crease, fold & reflect.

After reaching that point I want to get some results so I am thinking about using the examples in the java application. But they are compressed with LZW and have a proprietary file format. It seems like that was the real challenge for the author. I split my formats. Dived into java for the LZW algorithm (so I can copy & paste). This was annoying. Javas package structure, class vs. file conventions and so on made this anything else but a pleasure. Even that I did some java in the university.
For the second part, the parsing of the file format, I chose ruby. I love ruby, I'm not an expert but I use every chance to tinker with it. With the magic of pack und unpack I got quickly to the point where I could read in all commands.

## Fun with..
My collection of debug moments:

+ floating round errors: distanceToPlane(vertex) is not always 0 event if the vertex is on the plane
+ Create your own polygon list class and make the most basic function (containsIndex to find a vertex) returning wrong results
+ I read this down the rabbit hole: Plane with normal and cosntant is called http://mathworld.wolfram.com/HessianNormalForm.html
+ `if(index)` bite me as index could and should be zero and this test was intended as an undefined test 🤦‍♀️


## Ideas
+ Rendering: Vertex displacement in shader. To get some noise into the model.