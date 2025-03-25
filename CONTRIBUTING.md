# Contributing to KineticSlider

Thank you for your interest in contributing to KineticSlider! This document provides guidelines and steps for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes using conventional commits
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md with a note describing your changes
3. Ensure all tests pass
4. Request review from maintainers

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Maintain strict type checking
- Document complex types with JSDoc comments
- Use interfaces for object shapes
- Use type guards when necessary

### React
- Use functional components with hooks
- Follow React best practices
- Maintain prop types documentation
- Use React.memo() for performance optimization when needed

### Performance
- Optimize WebGL operations
- Use texture atlases for multiple images
- Implement proper cleanup in useEffect
- Monitor memory usage
- Profile performance impact of changes

### Testing
- Write unit tests for new features
- Include integration tests for complex interactions
- Maintain test coverage above 80%
- Use meaningful test descriptions

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Examples
```bash
feat: add new bloom filter effect
fix: resolve memory leak in texture atlas
docs: update README with new filter options
```

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/zachatkinson/kineticslider.git
cd kineticslider
```

2. Install dependencies
```bash
npm run dev:install
```

3. Start development server
```bash
npm run dev
```

4. Run tests
```bash
npm test
```

5. Build the project
```bash
npm run build
```

## Project Structure

```
kineticslider/
├── src/
│   ├── components/     # React components
│   ├── filters/        # WebGL filters
│   ├── hooks/          # Custom React hooks
│   ├── managers/       # Resource and state managers
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── tests/              # Test files
├── examples/           # Example implementations
└── docs/              # Documentation
```

## Getting Help

- Open an issue for bug reports
- Use discussions for questions
- Join our community chat
- Check existing issues and PRs

## Release Process

1. Version bumping is handled automatically by semantic-release
2. Changelog is generated from commit messages
3. Releases are created on GitHub
4. Package is published to npm

## License

By contributing, you agree that your contributions will be licensed under the project's Apache 2.0 License. 
