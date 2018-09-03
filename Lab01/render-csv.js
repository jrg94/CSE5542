var has_data = false;
var data;
var has_avgs = false;
var avgs = [];

function set_data(lines) {
  data = lines;
  has_data = true;
}

/**
 * Parses and sums data from a file in the form:
 *
 * species, sepal length, sepal width, petal length, petal width
 *
 * Produces an object of the form:
 *
 * {
 *   species: {
 *     sums: [],
 *     count: 0
 *   },
 *   ...
 * }
 */
function parseAndSumData() {
  var speciesCollection = {};
  var prevSpecies = "";
  for (var row = 1; row < data.length; row++) {
    var currSpecies = data[row][0];
    if (currSpecies !== "") {
      if (currSpecies !== prevSpecies) {
        prevSpecies = currSpecies;
        speciesCollection[currSpecies] = {};
        speciesCollection[currSpecies]["sums"] = [0, 0, 0, 0];
        speciesCollection[currSpecies]["count"] = 0;
      }
      speciesCollection[currSpecies]["count"] += 1;
      for (var col = 1; col < data[row].length; col++) {
        speciesCollection[currSpecies]["sums"][col - 1] += Number(data[row][col]);
      }
    }
  }
  console.log(speciesCollection);
  return speciesCollection;
}

/**
 * Produces a set of averages from a set of sums.
 */
function averageData(speciesCollection) {
  for (const species of Object.keys(speciesCollection)) {
    speciesCollection[species]["avgs"] = [0, 0, 0, 0];
    for (var i = 0; i < speciesCollection[species]["sums"].length; i++) {
      count = speciesCollection[species]["count"];
      avg = speciesCollection[species]["sums"][i] / count;
      speciesCollection[species]["avgs"][i] = avg;
    }
  }
  console.log(speciesCollection);
}

function csv_draw_bars(species) {
  if (!has_avgs) {
    var speciesCollection = parseAndSumData();
    avgs = averageData(speciesCollection);
    has_avgs = true;
  }
  createBarVertices(avgs);
}
