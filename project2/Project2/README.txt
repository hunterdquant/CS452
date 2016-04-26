First and Last Name
  Hunter Quant
Date
  04/17/2016

This is a 3D interactive animation created in WebGL that I call Proto.

The interaction:
  To interact with Proto click and drag on the canvas and it will rotate the scene.
  Once you are ready to move to the next scene press any key and Proto will go
  through a series of changes until reaching the final scene.

The shades:
  There are 5 shapes that are drawn in the duration of the animation.

  - A ellipsoid -> Uses a environment map to add reflection to the object.
  - A cube -> the cube has each face textured with a total of 6 textures to make a skybox.
  - A shard -> I generate 256 shards, each of which have a base color of gray.
  - A sphere -> the sphere is texture with a sun texture,
  - A 4 point star -> this is the star I've used for previous labs. It's base color is black.

The light:
  The lights are 2 directional lights that only have diffuse components.
  The reason for doing this wasn't just because of simplicity. I thought it would
  look really cool to have to clashing colors coming from opposing directions that
  envelope the objects in the scene. After you see the animation I think it's
  easy to see that I made the write decision.

The animation:
  The animation is broken up into 3 scenes.

  Scene 1) Scene 1 is a skybox with a ellipsoid in the center that acts as a mirror
           for the skybox using a cubmap. The matrices applied here are the scene
           rotation matrix and the matrix create from moving the viewer.
  Scene 2) We transition from scene 1 by shrinking the ellipsoid to scale 0, then
            start drawing the 256 shards that expand along their random direction
            until scale is 1. When scale is 1 the shards are translated back to the
            origin until scale is 0 again. The shards have 6 matrices applied.
             - 3 rotation matrices (one per axis).
             - A translation matrix
             - a scene rotation matrix
             - a viewer matrix
  Scene 3) After the shards are at the origin a sphere and star are drawn and slowly
           scale until the are their specified size. Once the sphere and star have expanded
           the transitions for the animation are over. The matrices applied to the
           sphere are a sphere rotation matrix, scene rotation matrix, and viewer matrix.
           The star has a rotation matrix, translation matrix, another rotation matrix,
           a scene rotation matrix, and a viewer matrix.

The code:
  The code for this one is quite long. When I started I was doing it in one JS file,
  and it quickly became a lot of code. I would have moved stuff to different files,
  but I've been strapped for time with finals and pre-internship necessities.
  As a result the code is not as documented as I would normally like.

The conclusion:
  I'm really happy with this animation. The only problem I have is with the
  interaction with the reflection map. But once I get that taken car of I think
  this will be a great project to embed into my website.
  
