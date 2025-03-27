const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

// Helper function for recursive validation
const isValidValue = (value, allowedTypes = ['string', 'number', 'boolean']) => {
  if (allowedTypes.includes(typeof value)) return true;
  if (Array.isArray(value)) {
    return value.every(v => typeof v === 'string');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every(v => isValidValue(v, allowedTypes));
  }
  return false;
};

// Validation functions
const validateMetrics = (metrics) => {
  if (!metrics) return false;
  return typeof metrics === 'object' && isValidValue(metrics, ['string', 'number']);
};

const validatePatterns = (patterns) => {
  if (!patterns) return false;
  return (
    typeof patterns === 'object' &&
    Array.isArray(patterns.required) &&
    Array.isArray(patterns.forbidden) &&
    patterns.required.every(p => typeof p === 'string') &&
    patterns.forbidden.every(p => typeof p === 'string')
  );
};

const validateIntegrations = (integrations) => {
  if (!integrations) return false;
  return typeof integrations === 'object' && isValidValue(integrations);
};

const validateSecurity = (security) => {
  if (!security) return false;
  return typeof security === 'object' && isValidValue(security);
};

const validateTesting = (testing) => {
  if (!testing) return false;
  return typeof testing === 'object' && isValidValue(testing);
};

const validateMaintenance = (maintenance) => {
  if (!maintenance) return false;
  return typeof maintenance === 'object' && isValidValue(maintenance);
};

const validateCompatibility = (compatibility) => {
  if (!compatibility) return false;
  return typeof compatibility === 'object' && isValidValue(compatibility);
};

const validateRule = (rule) => {
  // For frontmatter files, the rule might be in the JSON configuration section
  if (!rule) return { valid: true };
  
  if (typeof rule.enabled !== 'boolean') {
    return { valid: false, error: 'Rule must have a boolean enabled field' };
  }
  
  if (!['error', 'warning', 'info'].includes(rule.severity)) {
    return { valid: false, error: 'Rule must have a valid severity (error, warning, info)' };
  }
  
  if (typeof rule.autofix !== 'boolean') {
    return { valid: false, error: 'Rule must have a boolean autofix field' };
  }
  
  if (typeof rule.description !== 'string') {
    return { valid: false, error: 'Rule must have a string description' };
  }
  
  const options = rule.options || {};
  
  if (!validateMetrics(options.metrics)) {
    return { valid: false, error: 'Invalid metrics configuration' };
  }
  
  if (!validatePatterns(options.patterns)) {
    return { valid: false, error: 'Invalid patterns configuration' };
  }
  
  if (!validateIntegrations(options.integrations)) {
    return { valid: false, error: 'Invalid integrations configuration' };
  }
  
  if (!validateSecurity(options.security)) {
    return { valid: false, error: 'Invalid security configuration' };
  }
  
  if (!validateTesting(options.testing)) {
    return { valid: false, error: 'Invalid testing configuration' };
  }
  
  if (!validateMaintenance(options.maintenance)) {
    return { valid: false, error: 'Invalid maintenance configuration' };
  }
  
  if (!validateCompatibility(options.compatibility)) {
    return { valid: false, error: 'Invalid compatibility configuration' };
  }
  
  return { valid: true };
};

const validateConfig = (config) => {
  // Only validate version in the frontmatter
  if (!config.version || typeof config.version !== 'string') {
    return { valid: false, error: 'Config must have a string version in frontmatter' };
  }
  
  if (!config.description || typeof config.description !== 'string') {
    return { valid: false, error: 'Config must have a string description' };
  }
  
  if (!Array.isArray(config.globs)) {
    return { valid: false, error: 'Config must have an array of globs' };
  }
  
  if (typeof config.alwaysApply !== 'boolean') {
    return { valid: false, error: 'Config must have a boolean alwaysApply field' };
  }
  
  if (config.extends && !Array.isArray(config.extends)) {
    return { valid: false, error: 'Config extends must be an array if present' };
  }
  
  if (!Array.isArray(config.tags)) {
    return { valid: false, error: 'Config must have an array of tags' };
  }
  
  // Look for rule in the configuration section
  let jsonConfig = null;
  try {
    const configSection = config.Configuration;
    if (typeof configSection === 'string' && configSection.trim().startsWith('{')) {
      jsonConfig = JSON.parse(configSection);
    }
  } catch (error) {
    return { valid: false, error: 'Invalid JSON in Configuration section' };
  }
  
  // Validate either the direct rule or the one in the JSON configuration
  const ruleToValidate = config.rule || (jsonConfig && jsonConfig.rule);
  const ruleValidation = validateRule(ruleToValidate);
  if (!ruleValidation.valid) {
    return ruleValidation;
  }
  
  return { valid: true };
};

async function validateFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Find the YAML frontmatter between the first two '---' markers
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/m);
    if (!match) {
      return { valid: false, error: 'Invalid file format - missing YAML frontmatter' };
    }
    
    const yamlContent = match[1].trim();
    let config;
    try {
      config = yaml.load(yamlContent);
      if (!config || typeof config !== 'object') {
        return { valid: false, error: 'Invalid YAML frontmatter - must be an object' };
      }
    } catch (error) {
      return { valid: false, error: `Invalid YAML frontmatter: ${error.message}` };
    }
    
    // Try to parse the Configuration section if it exists
    const configMatch = content.match(/## Configuration\s*```json\s*([\s\S]*?)\s*```/);
    if (configMatch) {
      try {
        const jsonConfig = JSON.parse(configMatch[1]);
        config.Configuration = jsonConfig;
      } catch (error) {
        return { valid: false, error: 'Invalid JSON in Configuration section' };
      }
    }
    
    return validateConfig(config);
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function validateDirectory(dirPath) {
  const results = {};
  let allValid = true;
  
  try {
    const files = await fs.readdir(dirPath, { recursive: true });
    for (const file of files) {
      if (file.endsWith('.mdc')) {
        const filePath = path.join(dirPath, file);
        const result = await validateFile(filePath);
        results[file] = result;
        if (!result.valid) {
          allValid = false;
        }
      }
    }
    
    return { valid: allValid, results };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const target = args[0];
  
  if (!target) {
    console.error('Please provide a file or directory path to validate');
    process.exit(1);
  }
  
  (async () => {
    try {
      const stats = await fs.stat(target);
      if (stats.isDirectory()) {
        const result = await validateDirectory(target);
        console.log('Validation Results:', JSON.stringify(result, null, 2));
        process.exit(result.valid ? 0 : 1);
      } else {
        const result = await validateFile(target);
        console.log('Validation Result:', JSON.stringify(result, null, 2));
        process.exit(result.valid ? 0 : 1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  })();
} 