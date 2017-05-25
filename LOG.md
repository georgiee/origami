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
I tried different positions of my crease but it only works when I'm very high on the wings: The result is a crane with redicilious short wings 😅 So I guess my reflection in the beginning is at the wrong position and yields into a overall structure where I can't fold my wings. But I got it working with another order of actions: First fold the things and then relfect the bird base legs. I don't know at the moment if this would work in reality but it works with my code. So first milestone reached: Get a crane working. Yeah 🙌.

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
