# Contributing to ChatterSphere

Thank you for your interest in contributing to ChatterSphere! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/chattersphere.git`
3. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bugfix-name`
4. Install dependencies: `npm install`
5. Start the development server: `npm run dev`

## Development Workflow

1. Make your changes
2. Write or update tests for your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Fix any issues found by tests or linting
6. Commit your changes with a descriptive commit message
7. Push your branch to your fork
8. Create a pull request to the main repository

## Pull Request Requirements

All PRs must pass CI checks before they can be merged. This includes:

- Passing all tests
- No linting errors
- TypeScript type checking passes
- Maintaining or improving code coverage

## Testing Guidelines

- Write unit tests for all new functionality
- Update existing tests when modifying functionality
- Aim for at least 70% code coverage for critical modules
- Test both success and error paths

## Coding Standards

- Follow the existing code style
- Use TypeScript for type safety
- Document public APIs and complex functions
- Keep components small and focused
- Use meaningful variable and function names

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding or updating tests
- `chore:` for maintenance tasks

## License

By contributing to ChatterSphere, you agree that your contributions will be licensed under the project's license.

## Questions?

If you have any questions, please open an issue or contact the maintainers.
