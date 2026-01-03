import { exec } from 'node:child_process'
import { parseArgs } from 'node:util'
import jsdom from 'jsdom'

import { Args as PrinceArgs } from './args/prince';
import { type Args as DocusaurusArgs } from './args/docusaurus';

import { type IndexConfig } from './index.config';
import { file } from 'bun';

// const browser = new Browser()
const { JSDOM } = jsdom
const buffer = new Set()

const baseDir = import.meta.dir

const { values } = parseArgs({
  args: Bun.argv,
  options: <IndexConfig> { },
  strict: true,
  allowPositionals: true,
})

const parsedUrl = new URL(values.pathUrl.replace(/\/$/, ''))
const scope = parsedUrl.pathname
const scopeName = scope !== '/' ? `-${scope.replace(/\/$/g, '').replace(/^\//g, '').replace(/\//g, '-')}` : ''

const princeArgs: PrinceArgs = {
  css: {
    styleSheet: `${baseDir}/print.css`,
  },
  input: {
    inputList: `${values.pathDirectoryOutput}/${parsedUrl.hostname}${scopeName}.txt`,
  },
  pdfOutput: {
    outputFile: `/config/${values.output || `${values.pathDirectoryOutput}/${parsedUrl.hostname}${scopeName}.pdf`}`
  }
};
//const docusaurusArgs: DocusaurusArgs = {};

async function generatePdf() {
  console.log(`Generating PDF ${princeArgs.pdfOutput?.outputFile}`)

  if (!values.pathArgsPrince && !values.dockerImagePrince) { executeCommand(`prince ${princeArgs}`) } 
  else {
    const 
      regex = "^([a-z0-9._-]+/[a-z0-9._-]+)(?::([a-zA-Z0-9_][a-zA-Z0-9._-]{0,127}))?$",
      dockerBase = 'config', 
      dockerImage = values.dockerImagePrince && new RegExp(regex).test(values.dockerImagePrince) 
        ? values.dockerImagePrince
        : "sparanoid/prince" 
    
    princeArgs.css?.styleSheet ? `/${dockerBase}/${princeArgs.css?.styleSheet}` : null
    princeArgs.input?.inputList ? `/${dockerBase}/${princeArgs.input?.inputList}` : null
    princeArgs.pdfOutput?.outputFile ? `/${dockerBase}/${princeArgs.pdfOutput?.outputFile}` : null

    executeCommand(`docker run --rm -i -v "${baseDir}/:/${dockerBase}" ${dockerImage} ${princeArgs}`)
  }
}

async function executeCommand(command: string) { 
  await new Promise((resolve, reject) => {  
    console.log(`Executing command: ${command}`)

    exec(command, (error, stdout, stderr) => {
      if (error) 
        return reject(error)
      
      stdout ?? console.log(`Done: ${stdout}`)
      stderr ?? console.log(`Error: ${stderr}`)

      resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
    })
    
  }).catch(err => { throw new Error(err) })   
}

async function requestPage(url: string) {
  try {
    const resp = await fetch(url, { })
    const body = await resp.text()

    const dom = new JSDOM(body).window
    const nextLinkEl = dom.document.body.querySelector('.pagination-nav__link--next')

    // TODO: jsdom does not have built in DOM types.
    const nextLink = nextLinkEl && 'href' in nextLinkEl && `${parsedUrl.origin}${nextLinkEl.href}`
    const cycle = buffer.has(nextLink)

    if (!cycle && nextLink) {
      const nextLink = `${parsedUrl.origin}${nextLinkEl.href}`
      console.log(`Got link: ${nextLink}`)

      buffer.add(nextLink)
      requestPage(nextLink)
    } else {
      if (cycle) {
        console.log(`Pagination cycle detected on ${url}`)
      } else {
        console.log('No next link found!')
      }

      if (values.append) {
        values.pagesAppend.split(',').forEach(async item => {
          const url = item.match(/^https?:\/\//) ? item : `${parsedUrl.origin}${scope}${item}`
          buffer.add(url)
          console.log(`Got link: ${url} [append]`)
        })
      }

      if (buffer.size > 0 && princeArgs.input?.inputList) {
        console.log(`Writing buffer (${buffer.size} links) to ${princeArgs.input.inputList}`)
        await Bun.write(princeArgs.input.inputList, [...buffer].join('\n'))

        if (!values.onlyList) {
          generatePdf()
        }
      } else {
        console.log('No buffer to write!')
      }
    }
  } catch (err) {
    console.error('Error fetching page:', err)
  }
}

if (values['pdf-only']) { generatePdf() } 
else {
  if (values.pagesPrepend) {
    values.pagesPrepend.split(',').forEach(item => {
      const url = item.match(/^https?:\/\//) ? item : `${parsedUrl.origin}${scope}${item}`
      buffer.add(url)
      console.log(`Got link: ${url} [prepend]`)
    })
  }

  if (values['include-index']) {
    console.log(`Got link: ${parsedUrl.origin}${scope} [index]`)
    buffer.add(`${parsedUrl.origin}${scope}`)
  }

  requestPage(`${parsedUrl.origin}${scope}`)
}
