var has_data = false;
var data;
var has_avgs = false;
var avgs = {};

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
  return speciesCollection;
}

function analyzeData(speciesCollection) {
  for (const species of Object.keys(speciesCollection)) {
    var speciesData = speciesCollection[species];
    var speciesAvgs = speciesData["avgs"];
    speciesData["minAvg"] = 0;
    speciesData["maxAvg"] = 0;
    speciesData["avgRange"] = 0;

    // Declare working variables
    var min, max, range;
    min = Number(speciesAvgs[0]);
    max = Number(speciesAvgs[0]);

    // Gets min average, max average, and average range
    for (var i = 0; i < speciesAvgs.length; i++) {
      if (Number(speciesAvgs[i]) < min) {
        min = Number(speciesAvgs[i]);
      }
      if (Number(speciesAvgs[i]) > max) {
        max = Number(speciesAvgs[i]);
      }
    }
    range = max - min;

    // Store data back into object
    speciesData["minAvg"] = min;
    speciesData["maxAvg"] = max;
    speciesData["avgRange"] = range;
  }
  return speciesCollection;
}

function csv_draw_bars(species) {
  if (has_data) {
    if (!has_avgs) {
      this.avgs = analyzeData(averageData(parseAndSumData()));
      has_avgs = true;
    }
    console.log(this.avgs);
    createBarVertices(this.avgs, species);
  }
}
