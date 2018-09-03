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
 * Produces a set of sums in the form of:
 *
 * [
 *   [
 *      sepal length sum,
 *      sepal width sum,
 *      petal length sum,
 *      petal width sum
 *   ]
 * ]
 *
 * With a set of species meta data in the form of:
 *
 * {species: count, species: count, ... }
 *
 * Overall, the function returns an array of the form:
 *
 * [sum sets, species dict]
 */
function parseAndSumData() {
  sumSets = {};
  var prevSpecies = "";
  for (var row = 1; row < data.length; row++) {
    var currSpecies = data[row][0];
    for (var col = 1; col < data[row].length; col++) {
      if (currSpecies !== prevSpecies) {
        prevSpecies = currSpecies;
        sumSets[currSpecies] = {};
        sumSets[currSpecies]["sums"] = [0, 0, 0, 0];
        sumSets[currSpecies]["count"] = 0;
      }
      sumSets[currSpecies]["sums"][col - 1] += Number(data[row][col]);
      sumSets[currSpecies]["count"] += 1;
    }
  }
  console.log(sumSets);
  return sumSets;
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
