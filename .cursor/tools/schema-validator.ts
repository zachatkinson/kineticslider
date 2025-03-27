import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Base schema for metrics
const MetricsSchema = z.object({
  enabled: z.boolean(),
  thresholds: z.record(z.union([z.number(), z.string(), z.object({}).passthrough()])),
});

// Base schema for patterns
const PatternsSchema = z.object({
  enabled: z.boolean().optional(),
  required: z.array(z.string()),
  forbidden: z.array(z.string()),
}).and(z.record(z.any()));

// Base schema for integrations
const IntegrationsSchema = z.object({
  ide: z.object({
    enabled: z.boolean(),
    features: z.array(z.string()),
  }).optional(),
  build: z.object({
    enabled: z.boolean(),
    features: z.array(z.string()),
  }).optional(),
  test: z.object({
    enabled: z.boolean(),
    features: z.array(z.string()),
  }).optional(),
  monitor: z.object({
    enabled: z.boolean(),
    features: z.array(z.string()),
  }).optional(),
}).and(z.record(z.any()));

// Base schema for security
const SecuritySchema = z.object({
  enabled: z.boolean().optional(),
  requirements: z.array(z.string()).optional(),
  validations: z.array(z.string()).optional(),
}).and(z.record(z.any()));

// Base schema for testing
const TestingSchema = z.object({
  configValidation: z.boolean().optional(),
  unitTestRequired: z.boolean().optional(),
  integrationTestRequired: z.boolean().optional(),
  e2eTestRequired: z.boolean().optional(),
}).and(z.record(z.any()));

// Base schema for maintenance
const MaintenanceSchema = z.object({
  updateFrequency: z.string(),
  deprecationPolicy: z.string(),
  backwardCompatibility: z.string(),
});

// Base schema for compatibility
const CompatibilitySchema = z.record(z.string());

// Unified rule schema
const RuleSchema = z.object({
  enabled: z.boolean(),
  severity: z.enum(['error', 'warning', 'info']),
  autofix: z.boolean(),
  description: z.string(),
  options: z.object({
    metrics: MetricsSchema.optional(),
    patterns: PatternsSchema.optional(),
    integrations: IntegrationsSchema.optional(),
    security: SecuritySchema.optional(),
    testing: TestingSchema.optional(),
    maintenance: MaintenanceSchema.optional(),
    compatibility: CompatibilitySchema.optional(),
  }),
});

// Configuration file schema
const ConfigFileSchema = z.object({
  description: z.string(),
  version: z.string(),
  globs: z.array(z.string()),
  alwaysApply: z.boolean(),
  extends: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  rule: RuleSchema,
});

export class SchemaValidator {
  private static async readConfigFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    const parts = content.split('---');
    if (parts.length >= 3) {
      const yamlContent = parts[1].trim();
      return yaml.load(yamlContent);
    }
    throw new Error(`Invalid config file format: ${filePath}`);
  }

  static async validateFile(filePath: string): Promise<{
    valid: boolean;
    errors?: z.ZodError;
  }> {
    try {
      const config = await this.readConfigFile(filePath);
      await ConfigFileSchema.parseAsync(config);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: error };
      }
      throw error;
    }
  }

  static async validateDirectory(dirPath: string): Promise<{
    valid: boolean;
    results: Record<string, { valid: boolean; errors?: z.ZodError }>;
  }> {
    const results: Record<string, { valid: boolean; errors?: z.ZodError }> = {};
    let allValid = true;

    const files = await fs.readdir(dirPath, { recursive: true });
    for (const file of files) {
      if (file.endsWith('.mdc')) {
        const filePath = path.join(dirPath, file);
        const result = await this.validateFile(filePath);
        results[file] = result;
        if (!result.valid) {
          allValid = false;
        }
      }
    }

    return { valid: allValid, results };
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
        const result = await SchemaValidator.validateDirectory(target);
        console.log('Validation Results:', JSON.stringify(result, null, 2));
        process.exit(result.valid ? 0 : 1);
      } else {
        const result = await SchemaValidator.validateFile(target);
        console.log('Validation Result:', JSON.stringify(result, null, 2));
        process.exit(result.valid ? 0 : 1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  })();
} 