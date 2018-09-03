var has_data = false;
var data;
var has_avgs = false;
var avgs = {};
const SPECIES = "species"
const AVGS = "avgs";
const DATA = "data"

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
  var speciesCollection = {SPECIES: {}, DATA: {}};
  var speciesData = speciesCollection[SPECIES];
  var prevSpecies = "";
  for (var row = 1; row < data.length; row++) {
    var currSpecies = data[row][0];
    if (currSpecies !== "") {
      if (currSpecies !== prevSpecies) {
        prevSpecies = currSpecies;
        speciesData[currSpecies] = {};
        speciesData[currSpecies]["sums"] = [0, 0, 0, 0];
        speciesData[currSpecies]["count"] = 0;
      }
      speciesData[currSpecies]["count"] += 1;
      for (var col = 1; col < data[row].length; col++) {
        speciesData[currSpecies]["sums"][col - 1] += Number(data[row][col]);
      }
    }
  }
  return speciesCollection;
}

/**
 * Produces a set of averages from a set of sums.
 */
function averageData(speciesCollection) {
  speciesData = speciesCollection["species"];
  for (const species of Object.keys(speciesData)) {
    speciesData[species]["avgs"] = [0, 0, 0, 0];
    for (var i = 0; i < speciesData[species]["sums"].length; i++) {
      count = speciesData[species]["count"];
      avg = speciesData[species]["sums"][i] / count;
      speciesData[species]["avgs"][i] = avg;
    }
  }
  return speciesCollection;
}

/**
 * Produces a min, max, and range for the set of
 * averages for each species.
 */
function analyzeData(speciesCollection) {
  var superset = [];
  for (const species of Object.keys(speciesCollection)) {
    var speciesData = speciesCollection["species"][species];
    var speciesAvgs = speciesData["avgs"];
    speciesData["minAvg"] = 0;
    speciesData["maxAvg"] = 0;
    speciesData["avgRange"] = 0;

    var analysis = minMaxRange(speciesAvgs);

    // Store data back into object
    speciesData["minAvg"] = analysis[0];
    speciesData["maxAvg"] = analysis[1];
    speciesData["avgRange"] = analysis[2];
    superset.push(analysis[0]);
    superset.push(analysis[1]);
  }
  var supersetAnalysis = minMaxRange(superset);
  speciesCollection["data"]["minAvg"] = supersetAnalysis[0];
  speciesCollection["data"]["maxAvg"] = supersetAnalysis[1];
  speciesCollection["data"]["avgRange"] = supersetAnalysis[2];
  return speciesCollection;
}

function minMaxRange(dataSet) {
  // Declare working variables
  var min, max, range;
  min = Number(dataSet[0]);
  max = Number(dataSet[0]);

  // Gets min average, max average, and average range
  for (var i = 0; i < dataSet.length; i++) {
    if (Number(dataSet[i]) < min) {
      min = Number(dataSet[i]);
    }
    if (Number(dataSet[i]) > max) {
      max = Number(dataSet[i]);
    }
  }
  range = max - min;
  return [min, max, range];
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
