var has_data = false;
var data;
var has_avgs = false;
var avgs = {};
const SPECIES = "species";
const AVGS = "avgs";
const DATA = "data";
const SUMS = "sums";
const COUNT = "count";

function set_data(lines) {
  data = lines;
  has_data = true;
}

function initSpeciesCollection() {
  var speciesCollection = {};
  speciesCollection[SPECIES] = {};
  speciesCollection[DATA] = {};
  return speciesCollection;
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
  var speciesCollection = initSpeciesCollection();
  var speciesData = speciesCollection[SPECIES];
  var prevSpecies = "";
  for (var row = 1; row < data.length; row++) {
    var currSpecies = data[row][0];
    if (currSpecies !== "") {
      if (currSpecies !== prevSpecies) {
        prevSpecies = currSpecies;
        speciesData[currSpecies] = {};
        speciesData[currSpecies][SUMS] = [0, 0, 0, 0];
        speciesData[currSpecies][COUNT] = 0;
      }
      speciesData[currSpecies][COUNT] += 1;
      for (var col = 1; col < data[row].length; col++) {
        speciesData[currSpecies][SUMS][col - 1] += Number(data[row][col]);
      }
    }
  }
  return speciesCollection;
}

/**
 * Produces a set of averages from a set of sums.
 */
function averageData(speciesCollection) {
  speciesData = speciesCollection[SPECIES];
  for (const species of Object.keys(speciesData)) {
    speciesData[species][AVGS] = [0, 0, 0, 0];
    for (var i = 0; i < speciesData[species][SUMS].length; i++) {
      count = speciesData[species][COUNT];
      avg = speciesData[species][SUMS][i] / count;
      speciesData[species][AVGS][i] = avg;
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
  var speciesData = speciesCollection[SPECIES];
  for (const species of Object.keys(speciesData)) {
    var currSpeciesData = speciesData[species];
    var speciesAvgs = currSpeciesData["avgs"];
    currSpeciesData["minAvg"] = 0;
    currSpeciesData["maxAvg"] = 0;
    currSpeciesData["avgRange"] = 0;

    var analysis = minMaxRange(speciesAvgs);

    // Store data back into object
    currSpeciesData["minAvg"] = analysis[0];
    currSpeciesData["maxAvg"] = analysis[1];
    currSpeciesData["avgRange"] = analysis[2];
    superset.push(analysis[0]);
    superset.push(analysis[1]);
  }
  var supersetAnalysis = minMaxRange(superset);
  var collectionData = speciesCollection[DATA];
  collectionData["minAvg"] = supersetAnalysis[0];
  collectionData["maxAvg"] = supersetAnalysis[1];
  collectionData["avgRange"] = supersetAnalysis[2];
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
      console.log(this.avgs);
    }
    createBarVertices(this.avgs, species);
  }
}
