const AdjustmentFilter = jest.fn().mockImplementation(() => ({
  gamma: 1,
  saturation: 1,
  contrast: 1,
  brightness: 1,
  alpha: 1,
  red: 1,
  green: 1,
  blue: 1,
  enabled: true,
  apply: jest.fn(),
  destroy: jest.fn(),
}));

module.exports = {
  AdjustmentFilter
};
