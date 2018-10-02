# CSE 5542 Lab 02 Directions

Since all this code is hosted on GitHub, you can run this solution
using the [RawGit tool][9].

Alternatively, you can open the solution locally by double-clicking the
HTML file to run the solution in your browser. Personally,
I tested on **Google Chrome** and **Windows 10**.

With the solution open, you can begin playing with the following controls:

- w: up
- a: left
- s: down
- d: right
- q: scale down
- e: scale up
- 1: camera pan up
- 2: camera pan down
- 3: camera pan left
- 4: camera pan right
- 5: camera zoom in
- 6: camera zoom out
- left click + drag: rotation

In addition, you can control each body part of the ant individually which
is actually a load of fun. Feel free to detach a leg and watch it follow the
body anyway.

From there, you have all you need to navigate the maze.

The solution should render as follows:

![Sample Scene][1] 

Source credit goes to Dr. Han-Wei Shen who provided the template code via their
[OSU course website][2]. Namely, [`code06.html`][3], [`code06.js`][4],
and [`shader_setup_5.js`][7].

Changes to these templates included:

1. Moving shaders out of HTML and into a [`shaders.js`][8] file.
2. Improving software craftmanship.

Solution is freely available under the MIT license.

[1]: https://github.com/jrg94/CSE5542/blob/master/Lab02/ant-maze.JPG
[2]: http://www.cse.ohio-state.edu/~shen.94/5542
[3]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code06.html
[4]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code06.js
[7]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/shaders_setup_5.js
[8]: https://github.com/jrg94/CSE5542/blob/master/Lab02/shaders.js
[9]: https://cdn.rawgit.com/jrg94/CSE5542/v2.0.0/Lab02/lab02.html
