var has_data = false;
var data;
var has_avgs = false;
var sums = [];
var species = {};
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
  speciesCollection = {};
  var prevSpecies = "";
  for (var row = 1; row < data.length; row++) {
    var currSpecies = data[row][0];
    for (var col = 1; col < data[row].length; col++) {
      if (currSpecies !== prevSpecies) {
        prevSpecies = currSpecies;
        speciesCollection[currSpecies] = {};
        speciesCollection[currSpecies]["sums"] = [0, 0, 0, 0];
        speciesCollection[currSpecies]["count"] = 0;
      }
      speciesCollection[currSpecies]["sums"][col - 1] += Number(data[row][col]);
      speciesCollection[currSpecies]["count"] += 1;
    }
  }
  console.log(speciesCollection);
  return speciesCollection;
}

/**
 * Produces a set of averages from a set of sums.
 */
function averageData(sumSets, speciesDict) {
  for (var row = 0; row < sumSets.length; row ++) {
    for (var col = 0; col < sumSets[row].length; col++) {
      sumSets[row][col] = sumSets[row][col] / (speciesDict);
    }
  }
  console.log("Set of averages: " + sumSets);
  return sumSets;
}

function csv_draw_bars(species) {
  if (!has_avgs) {
    var tuple = parseAndSumData();
    sums = tuple[0];
    species = tuple[1];
    avgs = averageData(sums, species);
    has_avgs = true;
  }
  createBarVertices(avgs);
}
