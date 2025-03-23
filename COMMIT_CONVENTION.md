## Conventional Commits Cheatsheet

### Basic Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes to build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit


### Format
```
<type>(<optional scope>): <description>

<optional body>

<optional footer(s)>
```

### Examples
```
feat(auth): add login with Google

fix(api): prevent race condition in data fetching

docs(readme): update installation instructions

style: format code with prettier

refactor(orders): simplify payment processing logic

perf(images): optimize image loading

test(auth): add tests for password reset

build(deps): update dependency versions

ci(github): update GitHub Actions workflow

chore: update .gitignore file

revert: revert commit abc123
```

### Breaking Changes
Add an exclamation mark after the type/scope or include "BREAKING CHANGE:" in the footer:
```
feat!: change user authentication API

feat(auth): add OAuth support

BREAKING CHANGE: users need to re-authenticate with new tokens
```

### Scopes
Scopes should be consistent throughout the project. Common scopes include:
- Component names: `button`, `modal`, `header`
- Features: `auth`, `payments`, `notifications`
- File types: `css`, `ts`, `config`

### Best Practices
1. Keep the first line under 72 characters
2. Description should be in imperative mood: "add" not "adds/added"
3. Don't capitalize the first letter of description
4. No period at the end of description
5. Separate subject from body with a blank line
6. Use body to explain what and why vs. how
7. Reference issues and pull requests in the footer

### Emoji (Optional but Popular)
- ✨ `:sparkles:` - for `feat`
- 🐛 `:bug:` - for `fix`
- 📝 `:memo:` - for `docs`
- 💄 `:lipstick:` - for `style`
- ♻️ `:recycle:` - for `refactor`
- ⚡️ `:zap:` - for `perf`
- ✅ `:white_check_mark:` - for `test`
- 👷 `:construction_worker:` - for `build`
- 🔧 `:wrench:` - for `ci`
- 🔨 `:hammer:` - for `chore`
- ⏪ `:rewind:` - for `revert`
- 💥 `:boom:` - for breaking changes

### Tools
- **commitizen**: CLI tool to help format commits
- **commitlint**: Lint commit messages
- **husky**: Git hooks to enforce conventions
- **standard-version**: Automate versioning and CHANGELOG generation
- **semantic-release**: Fully automated version management and package publishing

You can save this as a `COMMIT_CONVENTION.md` file in your repository for quick reference!
