# CSE 5542 Lab 05

Welcome to Lab 05!

## Directions

Since all this code is hosted on GitHub, you can run this solution
using [GitHub Pages][9]. Beware that this link may not work. I
had questionable performance from it (cross-origin errors).

Alternatively, you can open the solution locally by double-clicking the
HTML file to run the solution in your browser. Personally,
I tested on **Google Chrome** and **Windows 10**.

**Warning**: You will need to launch your own local server to get the local JSON.
If you're on Windows and you have Python 3, feel free to use the `server.bat`
file to launch a local server to `localhost:8000`.

With the solution open, you can begin playing with the following controls:

- a: strafe left
- d: strafe right
- space: fire projectile

In addition, there are buttons for the various texture options.

The solution should render as follows:

![Sample Scene][1]

## Features

This solution features several changes to Lab 04. In addition to texture mapping
and environment mapping, this project has the following features:

1. Camera locks onto plane and follows plane wherever it geos
2. Plane strafes left and right
  - Strafe includes a rotation to improve realism
  - Plane always rotates to level when not strafing
3. Plane fires projectiles
  - Projectiles have random rotation associated with them
  - Projectiles are cached (only 10 at a time) and recycled when they leave the scene
4. All assets are loaded only once
  - Queries are never made more than once as all assets are saved in the scene
  - Added a loading bar to demonstrate querying of assets
5. Boat is animated to traverse the water
  - Boat travels left and right with rotation when it reaches the furthest bounds
6. Plane has an attempt at a bump map
  - It's tough to tell if the shader is working; please check out the code to confirm
  - Normal maps were generated using http://cpetry.github.io/NormalMap-Online/

All-in-all there were a lot of additions to this scene that should cover
all the bases for this project.

## References

Source credit goes to Dr. Han-Wei Shen who provided the template code via their
[OSU course website][2]. Namely, [`code12.html`][3], [`code12.js`][4],
and [`shader_setup_5.js`][7].

Changes to these templates included:

1. Moving shaders out of HTML and into a [`shaders.js`][8] file.
2. Improving software craftmanship.

Textures included are all free to use without credit from source.

Models included were all generated from 3D Paint and converted to JSON
using assimp2json.

## License

Solution is freely available under the MIT license.

[1]: cube-map.JPG
[2]: http://www.cse.ohio-state.edu/~shen.94/5542
[3]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code12.html
[4]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code12.js
[7]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/shaders_setup_5.js
[8]: JS/shaders.js
[9]: lab05.html
