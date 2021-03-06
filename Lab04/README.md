# CSE 5542 Lab 04 Directions

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

- left click + drag: rotate camera

In addition, there are buttons for the various texture options.

The solution should render as follows:

![Sample Scene][1]

Source credit goes to Dr. Han-Wei Shen who provided the template code via their
[OSU course website][2]. Namely, [`code12.html`][3], [`code12.js`][4],
and [`shader_setup_5.js`][7].

Changes to these templates included:

1. Moving shaders out of HTML and into a [`shaders.js`][8] file.
2. Improving software craftmanship.

Solution is freely available under the MIT license.

[1]: cube-map.JPG
[2]: http://www.cse.ohio-state.edu/~shen.94/5542
[3]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code12.html
[4]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code12.js
[7]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/shaders_setup_5.js
[8]: JS/shaders.js
[9]: lab04.html
