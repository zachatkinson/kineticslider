// This file mocks asset files like images or fonts
// Mock file for handling file imports in Jest tests
module.exports = function(path) {
  // If this is one of our test assets, return the actual path
  if (path.startsWith('/images/') || path.startsWith('/atlas/')) {
    return path;
  }
  // For other files, return a stub
  return 'test-file-stub';
};
