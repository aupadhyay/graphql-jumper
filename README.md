# graphql-jumper

tiny extension to fix graphql codegen goto definition.


before: write graphql query, codegen, typescript hook (`useFriggingQuery`) goto sends me to codegen. useless.


now: goto sends me to `query FriggingQuery`.


## install
 
- `pnpm install && pnpm run package`
- `pnpm exec vsce package --no-dependencies`
- cursor: `cursor --install-extension graphql-jumper-0.0.1.vsix`
- vscode (respect): `code --install-extension graphql-jumper-0.0.1.vsix`

## config

add to settings.json if graphql files not in `src/graphql`:

```json
{
  "graphqlJump.searchRoot": "path/to/your/graphql/files"
}
```
