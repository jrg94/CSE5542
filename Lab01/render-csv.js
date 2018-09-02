var has_data = false;
var data;
var has_avgs = false;
var avgs = [];

function set_data(lines) {
  data = lines;
  has_data = true;
}

function csv_draw_bars(species) {
  avgs = [0, 0, 0, 0];
  for (var row = 1; row < data.length; row++) {
    for (var col = 1; col < data[row].length; col++) {
      if (data[row][0] === species) {
        avgs[col - 1] += Number(data[row][col]);
      }
    }
  }
  console.log(avgs);
  for (var j = 0; j < data[0].length; j++) {
    avgs[j] = avgs[j] / (data.length - 1);
    console.log(" column " + j + " Avg = " + avgs[j]);
  }

  has_avgs = true;

  createBarVertices(avgs);

}
