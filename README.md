# ThorJS documentation

## Typescript
#### Running
After running `npm install` 
Typescript commands:
  -`npx ts-node <filename> # to compile and run file`
  -`npx tsc <filename> to compile file to js`

To globally install ts-node and typescript commands run 
`npm install -g ts-node` then you can just run `ts-node <filename`

more command line options can be found [here (ts-node)](https://github.com/TypeStrong/ts-node) and [here (tsc)](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

#### Publishing
Run `npm run prepublish` to compile all ts files to js and .d.ts in dist folder, then run `npm pack`

#### Type Annotations
When declaring types or interfaces the longhand description is preffered i.e.(Array<T>). When implementing types in classes, functions and objects the shorthand notation is preffered i.e.(T[])


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