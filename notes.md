1. Get the camera position
vector.setFromMatrixPosition(camera.matrixWorld)

2. Unprojection

z value is the screen depth value (-1 to 1 (see Camera Helper), translates to the z-depth bewteen near and far plane)

First off, note from the diagram that a 2D mouse click does not translate into a point, but into a ray — after all, we are adding an entire dimension. So, we can’t really go from a mouse point to a single 3D point; the best we can do is identify the line along which the mouse point’s 3D equivalent must lie
http://myweb.lmu.edu/dondi/share/cg/unproject-explained.pdf

Using vector.unproject( camera ) you can get a ray pointing in the direction you want.
You just need to extend that ray, from the camera position, until the z-coordinate of the tip of the ray is zero.
http://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z

gluUnProject on opengl
