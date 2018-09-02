var has_data = false;
var data;
var has_avgs = false;
var avgs = [];

function set_data(lines) {
  data = lines;
  has_data = true;
}

function csv_draw_bars(species) {
  // Reset averages
  avgs = [0, 0, 0, 0];

  // Sum data
  for (var row = 1; row < data.length; row++) {
    for (var col = 1; col < data[row].length; col++) {
      if (data[row][0] === species) {
        avgs[col - 1] += Number(data[row][col]);
      }
    }
  }

  // Average data
  for (var j = 0; j < data[0].length; j++) {
    avgs[j] = avgs[j] / (data.length - 1);
  }

  // Signal new data
  has_avgs = true;
  createBarVertices(avgs);
}
