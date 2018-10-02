// Square vertices
const SQUARE = [
  0.5, 0.5, 0.0,
  -0.5, 0.5, 0.0,
  -0.5, -0.5, 0.0,
  0.5, -0.5, 0.0,
];

const RECT = [
  0.20, 1, 0.0,
  -0.20, 1, 0.0,
  -0.20, 0.0, 0.0,
  0.20, 0.0, 0.0,
];

// Line vertices
const AXES = [
  0.0, 0.0, 0.0,
  0.7, 0.0, 0.0,
  0.0, 0.0, 0.0,
  0.0, 0.7, 0.0,
];

// Colors
const COLORS = [
  1.0, 0.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 0.0, 1.0, 1.0,
  1.0, 0.0, 0.0, 1.0,
];

const MAZE = [
  // Entrance wall behind player
  -1.0, 1.0, 0.0,
  -1.0, -1.0, 0.0,
  // Top wall by player
  -1.0, 1.0, 0.0,
  3.0, 1.0, 0.0,
  // Bottom wall by player
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0,
  // First tunnel left wall
  1.0, -1.0, 0.0,
  1.0, -3.0, 0.0,
  // First tunnel right wall
  2.0, -1.0, 0.0,
  2.0, -3.0, 0.0,
  // First tunnel dead end
  1.0, -3.0, 0.0,
  2.0, -3.0, 0.0,
  // Second tunnel right wall
  3.0, 1.0, 0.0,
  3.0, -3.0, 0.0,
  // Second tunnel end
  4.0, -5.0, 0.0,
  0.0, -5.0, 0.0,
  // Third tunnel north
  4.0, -5.0, 0.0,
  4.0, 1.0, 0.0,
  // Fourth tunnel dead end
  0.0, -5.0, 0.0,
  0.0, -1.0, 0.0,
  // Third tunnel turn
  6.0, 3.0, 0.0,
  -1.0, 3.0, 0.0,
  // Fifth tunnel
  5.0, 3.0, 0.0,
  5.0, 0.0, 0.0,
  // Fifth tunnel break
  5.0, -2.0, 0.0,
  5.0, -7.0, 0.0,
  // Fifth tunnel dead end part 1
  5.0, -7.0, 0.0,
  -1.0, -7.0, 0.0,
  // Fifth tunnel dead end part 2
  -1.0, -7.0, 0.0,
  -1.0, 0.0, 0.0,
  // Sixth tunnel main wall
  6.0, 3.0, 0.0,
  6.0, -7.0, 0.0,
  // Third tunnel dead end
  -1.0, 3.0, 0.0,
  -1.0, 1.0, 0.0,
];
