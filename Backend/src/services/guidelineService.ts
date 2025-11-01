export interface CodingGuideline {
  id: string;
  name: string;
  language: string[];
  description: string;
  rules: string;
}

export class GuidelineService {
  private static guidelines: CodingGuideline[] = [
    {
      id: "pep8-python",
      name: "PEP 8 - Python Style Guide",
      language: ["python"],
      description: "Official Python style guide. Covers naming, formatting, and best practices.",
      rules: `PEP 8 Guidelines:
1. Use 4 spaces for indentation (no tabs)
2. Maximum line length: 79 characters for code, 72 for comments
3. Use blank lines to separate top-level definitions (2 lines) and method definitions (1 line)
4. Naming conventions:
   - Functions: snake_case
   - Variables: snake_case
   - Classes: PascalCase
   - Constants: UPPER_SNAKE_CASE
   - Private: leading underscore _private_var
5. Import order: standard library, third-party, local
6. Avoid wildcard imports (from module import *)
7. Use docstrings for all modules, classes, and functions
8. Use type hints for function parameters and return types
9. Use list comprehensions over map/filter when readable
10. Use f-strings for string formatting (Python 3.6+)`,
    },
    {
      id: "google-python",
      name: "Google Python Style Guide",
      language: ["python"],
      description: "Google's comprehensive Python style guide with additional best practices.",
      rules: `Google Python Style Guide:
1. Follow PEP 8 with these additions
2. Use 2 spaces for indentation in continuation lines
3. Line length: 80 characters (strict)
4. Use type hints for all function signatures
5. Use docstrings following Google style format
6. Prefer explicit is None/is not None over == None
7. Use pathlib instead of os.path
8. Use logging instead of print statements
9. Prefer list comprehensions and generator expressions
10. Use context managers for file operations
11. Use dataclasses for simple data containers
12. Avoid mutable default arguments`,
    },
    {
      id: "google-java",
      name: "Google Java Style Guide",
      language: ["java"],
      description: "Google's Java style guide for consistent code formatting and conventions.",
      rules: `Google Java Style Guide:
1. Use 2 spaces for indentation (not tabs)
2. Maximum line length: 100 characters (column limit: 100)
3. One statement per line
4. Braces are required for all control structures (if, for, while, etc.)
5. Naming conventions:
   - Classes: PascalCase
   - Methods/Variables: camelCase
   - Constants: UPPER_SNAKE_CASE
   - Package names: lowercase, no underscores
6. Use @Override annotation when overriding methods
7. Use @Nullable and @NonNull annotations
8. Prefer composition over inheritance
9. Use dependency injection
10. Use immutable objects when possible
11. Avoid magic numbers - use named constants
12. Use try-with-resources for resource management`,
    },
    {
      id: "airbnb-javascript",
      name: "Airbnb JavaScript Style Guide",
      language: ["javascript", "typescript"],
      description: "Popular JavaScript style guide used by Airbnb and many teams.",
      rules: `Airbnb JavaScript/TypeScript Style Guide:
1. Use 2 spaces for indentation
2. Use single quotes for strings
3. Semicolons are required
4. Use camelCase for variable names, PascalCase for constructors/classes
5. Use const for variables that never change, let for reassignable
6. Avoid var
7. Use === and !== over == and !=
8. Use arrow functions for callbacks
9. Use template literals over string concatenation
10. Use object destructuring
11. Prefer named exports over default exports
12. Use trailing commas in multi-line objects/arrays
13. Maximum line length: 100 characters
14. Use meaningful variable names
15. One variable per declaration`,
    },
    {
      id: "microsoft-csharp",
      name: "Microsoft C# Coding Conventions",
      language: ["csharp"],
      description: "Official Microsoft C# style guide and conventions.",
      rules: `Microsoft C# Coding Conventions:
1. Use 4 spaces for indentation
2. Use PascalCase for public members (classes, methods, properties)
3. Use camelCase for private fields and local variables
4. Use _camelCase for private instance fields
5. Use PascalCase for constants
6. Use meaningful names - avoid abbreviations
7. Use readonly for fields that are never reassigned
8. Use var for local variables when type is obvious
9. Use expression-bodied members when appropriate
10. Use null-conditional operators (?.) and null-coalescing (??)
11. Use async/await instead of Task.Result
12. Avoid magic strings - use const or enums
13. Use XML documentation comments for public APIs`,
    },
    {
      id: "rust-standard",
      name: "Rust API Guidelines",
      language: ["rust"],
      description: "Official Rust style guide and API design guidelines.",
      rules: `Rust API Guidelines:
1. Use rustfmt for consistent formatting
2. Use snake_case for functions and variables
3. Use PascalCase for types, traits, and enums
4. Use SCREAMING_SNAKE_CASE for constants
5. Prefer &str over &String in function parameters
6. Use Result<T, E> for error handling
7. Use Option<T> for nullable values
8. Prefer borrowing over ownership when possible
9. Use meaningful error types
10. Document public APIs with /// comments
11. Use clippy for linting
12. Maximum line length: 100 characters`,
    },
    {
      id: "eslint-recommended",
      name: "ESLint Recommended Rules",
      language: ["javascript", "typescript"],
      description: "Recommended ESLint rules for modern JavaScript/TypeScript.",
      rules: `ESLint Recommended Rules:
1. No unused variables
2. No unreachable code after return/throw
3. No console statements in production code
4. No debugger statements
5. No duplicate keys in objects
6. No duplicate case labels in switch
7. No empty block statements
8. No eval() usage
9. No unsafe finally blocks
10. No this before super() in constructors
11. No unused labels
12. Use strict equality (===) operators`,
    },
  ];

  static getAll(): CodingGuideline[] {
    return this.guidelines;
  }

  static getById(id: string): CodingGuideline | undefined {
    return this.guidelines.find((g) => g.id === id);
  }

  static getByLanguage(language: string): CodingGuideline[] {
    return this.guidelines.filter((g) =>
      g.language.some((lang) => lang.toLowerCase() === language.toLowerCase())
    );
  }

  static combineGuidelines(guidelineIds: string[]): string {
    const selected = this.guidelines.filter((g) =>
      guidelineIds.includes(g.id)
    );

    if (selected.length === 0) {
      return "";
    }

    return (
      "CODING GUIDELINES TO ENFORCE:\n" +
      selected
        .map((g) => `\n[${g.name}]\n${g.rules}`)
        .join("\n\n") +
      "\n"
    );
  }

  static validateGuidelineIds(ids: string[]): { valid: string[]; invalid: string[] } {
    const validIds = new Set(this.guidelines.map((g) => g.id));
    const valid: string[] = [];
    const invalid: string[] = [];

    ids.forEach((id) => {
      if (validIds.has(id)) {
        valid.push(id);
      } else {
        invalid.push(id);
      }
    });

    return { valid, invalid };
  }
}

