// @ts-ignore
import openInEditor from 'open-in-editor'

import os from 'node:os'
import path from 'node:path'
import { Plugin } from 'vite'

const editor: { open(filename: string): Promise<void> } = openInEditor.configure({
  editor: 'code',
  dotfiles: 'allow',
})

export const OpenInEditor = (): Plugin => ({
  name: 'open-in-editor',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.method === 'POST') {
        const fsPath = req.url!.slice(1).replace('@fs', '')
        const homedir = os.homedir()
        console.log(fsPath, homedir)
        let filename: string
        if (fsPath.startsWith(homedir)) {
          filename = fsPath
        }
        else {
          filename = path.join(process.cwd(), fsPath)
        }
        try {
          await editor.open(filename)
        }
        catch (error) {
          res.writeHead(500)
          res.end((error as Error).message)
          return
        }
        res.writeHead(200, {
          'content-type': 'text/html'
        })
        res.end('<script>window.close()</script>')
        return
      }
      next()
    })
  },
})
