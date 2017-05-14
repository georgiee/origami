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
Well I should have thought more over this. I wanted to gradually move over to this new datat structure and therefore used it at some place. Stupid that that containsIndex()
to determine if a vertex is inside a polygon was not workign as expected. I didn't thought of it so I spend far too much time finding that stupid error.
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
