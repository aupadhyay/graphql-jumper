import * as vscode from "vscode"
import * as fs from "node:fs"

export function activate(context: vscode.ExtensionContext) {
  console.log("Activating extension: graphql-jumper")
  const searchRoot =
    vscode.workspace
      .getConfiguration("graphqlJump")
      .get<string>("searchRoot") ?? "src/graphql"

  const langs = [
    "typescript",
    "typescriptreact",
    "javascript",
    "javascriptreact",
  ]

  for (const lang of langs) {
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        { language: lang },
        new GraphqlDefinitionProvider(searchRoot)
      )
    )
  }
}

class GraphqlDefinitionProvider implements vscode.DefinitionProvider {
  private root: string
  private cache: Map<string, vscode.Location> = new Map()
  private readonly MAX_CACHE_SIZE = 10

  constructor(root: string) {
    this.root = root
  }

  private addToCache(key: string, location: vscode.Location) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, location)
  }

  provideDefinition(doc: vscode.TextDocument, pos: vscode.Position) {
    const wordRange = doc.getWordRangeAtPosition(pos, /[A-Za-z0-9_]+/)
    if (!wordRange) return
    const word = doc.getText(wordRange)

    console.log(`Word: ${word}`)

    // extract possible operation name
    let op = word
    const m1 = /^use([A-Z][A-Za-z0-9_]+?)(Query|Mutation|Subscription)$/.exec(
      word
    )
    if (m1) op = m1[1]
    const m2 = /^([A-Z][A-Za-z0-9_]+)Document$/.exec(word)
    if (m2) op = m2[1]

    const cachedLocation = this.cache.get(op)
    if (cachedLocation) {
      console.log(`Cache hit for: ${op}`)
      this.addToCache(op, cachedLocation)
      return cachedLocation
    }

    const files = vscode.workspace.findFiles(
      `${this.root}/**/*.graphql`,
      "**/node_modules/**",
      200
    )

    return files.then(async (uris) => {
      for (const uri of uris) {
        const text = await fs.promises.readFile(uri.fsPath, "utf8")
        const regex = new RegExp(`\\b(query|mutation|subscription)\\s+${op}\\b`)
        const match = regex.exec(text)
        if (match) {
          const lines = text.substring(0, match.index).split("\n")
          const line = lines.length - 1
          const character = lines[lines.length - 1].length
          const location = new vscode.Location(
            uri,
            new vscode.Position(line, character)
          )
          this.addToCache(op, location)
          return location
        }
      }
      return undefined
    })
  }
}

export function deactivate() {}
