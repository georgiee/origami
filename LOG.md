## 170518
Finally got the number thing straight. I mean I always expected some overflowing integer but I couldn't get my head around how to reproduce it in ruby
without having a number example from java. Today I was in the mood to hack some java code together, outputting all the numbers at the command block section of the file format.

It's basically a signed short value overflow into negative values - where my ruby part never overflowed nor did my unpacking strategy
with different signed integer size get me anywhere. I think when I tried unpacking with bytes.unpack("@4cC3") I was really near.
I get a -2 instead of a 254 for example. But the thing is": short java unsigned has the range of -32,768 to 32,767.
This woudl mean I have to use the 16bit unpacking directive (S or s). But this would only mean that it is also expecting more bytes and not only the single byte I provide
per number. Solution: Just unpack the bytes as usual 8bit values unsigned and then do the overflowing manually.
That's the wodnerful piece of overflowing in ruby I found. And now every number fits and I can go on applying all commands from the given file
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
The only thing is: When I switch over to the crane playbook which is the bird base + crane specifics it fails at the moment where it tris to do a index based reflection.

This means: My indices are not the same as in the given file format (I think because I'm not tidying up empty polygons yet)
and even if I manually select the correct polygon index to reflect it is just doing nothing. So back to debug mode. But that's half of the fun isn't it ?! 🙌

Funny bug in `reflectIndex`. I don't break the inner loop over the selection.
So I basically search over every index. Then I iterate over the whole list of involved polygons (selected). if some of them contains the vertex
it's involved in the selected polygon folding action. But if I don't cancel the inner loop I immediately reflect my vertex back and nothign happens.
Stupid🤦‍♀️

Ok it seems that every base function (reflect, fold) is working now. Reading the existing save files form the other app works too
but the index still mismatch. I will look into this next time working on this. I'm eager to do so, because my UI sucks at the moment.
It is easier to use an existing set of folding commands instead of building my own set from my paper origami sources.

## 170516
Problem: NULL Error when raycasting. But only when I'm using the very large setup to match the 400x400 setup from the original sources.
Solution: Raycasting is using the camera position (as I set it with setFromCamera). In my setup the camera is at 100. So if I rotate the object
in front of the camera it is projected as usual but in reality it is beind the camera. It's not visible because of the orthographic camera.
Behind the camera means my ray shoots in the wrong direction.

I have to fix my camera distance (with z, no effect on the projection but clipping) or adjust the ray accordingly.

Things to do:
+ My polygons quickly degenerate (vertices reflected far away, non drawable triangles,). Maybe I forgot some checks?
+ I also found that shrinkWithIndex is not in use.
+ Show the (potential) folding line in the creasing pattern. Is there a shortcut by using the vertices2D or do I have to do a full (temporay) crease to find the folding line?
+ Check the file format with the bit float bit conversion again.
+ Fix the creasing view in a separate viewport with a separate camera.
+ Allow the camera to move without changing the reuslt of the ruler. Currently the plane is misaligned then.
It's fine from the view of the camera, but wrong from the view of the origiami - reflecting for example results in two sides not laying on each other liek usual.


commandBlock(int foid, double[] ppoint, double[] pnormal, int polygonIndex, int phi) {
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

After reaching that point I want to get soem results so I am thinking about using the examples in the java application. But they are compressed with LZW and have a proprietary file format. It seems like that was the real challenge for the author. I split my formats. Dived into java for the LZW algorithm (so I can copy & paste). This was annoying. Javas package structure, class vs. file conventions and so on made this anything else but a pleasure. Even that I did some java in the university.
For the second part, the parsing of the file format, I chose ruby. I love ruby, I'm not an expert but I use every chance to tinker with it. With the magic of pack und unpack I got quickly to the point where I could read in all commands.

## Fun with..
My collection of debug moments:

+ floating round errors: distanceToPlane(vertex) is not always 0 event if the vertex is on the plane
+ Create your own polygon list class and make the most basic function (containsIndex to find a vertex) returning wrong results
