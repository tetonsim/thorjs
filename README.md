# ThorJS documentation

## Eslint 
Before submitting a PR run eslint against the changed files to check and fix common styling error

Command line actions:
- `npx eslint ./` to run against all files
- `npx eslint <file>` to run against specific file
- `npx eslint <file> --fix` to fix minor mistakes i.e. semicolons, indention etc
- More command line options [here](https://eslint.org/docs/user-guide/command-line-interface)

Rules: 
- If a rule is causing problems it can be disabled inline, infile, or projectwide
- If a rule is needed it can be found [here](https://eslint.org/docs/rules/)