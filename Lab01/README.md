# CSE 5542 Lab 01 Directions

Since all this code is hosted on GitHub, you can run this solution
using the [RawGit tool][9].

Alternatively, you can open the solution locally by double-clicking the 
HTML file to run the solution in your browser. Personally, 
I tested on **Google Chrome** and **Windows 10**.

With the solution open, scroll to the bottom and select `choose file`
from the Graph Data Import section. From there, select your Iris data.
I've included a copy in this solution for your convenience.

With the csv data loaded, choose any of the buttons from Graph Controls
menu to begin plotting data. That's it!

The solution should render as follows:

![Sample Graph][1]

Source credit goes to Dr. Han-Wei Shen who provided the template code via their 
[OSU course website][2]. Namely, [`code05.html`][3], [`code05.js`][4], [`code05-csv.js`][5],
[`read-csv.js`][6], and [`shader_setup_5.js`][7].

Changes to these templates included:

1. Moving shaders out of HTML and into a [`shaders.js`][8] file.
2. Reworking global fields into passable object

Solution is freely available under the MIT license.

[1]: https://github.com/jrg94/CSE5542/blob/master/Lab01/sample-graph.JPG
[2]: http://www.cse.ohio-state.edu/~shen.94/5542
[3]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code05.html
[4]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code05.js
[5]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/code05-csv.js
[6]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/read-csv.js
[7]: http://web.cse.ohio-state.edu/~shen.94/5542/Site/WebGL_files/shaders_setup_5.js
[8]: https://github.com/jrg94/CSE5542/blob/master/Lab01/shaders.js
[9]: https://cdn.rawgit.com/jrg94/CSE5542/v1.0.0/Lab01/lab01.html
