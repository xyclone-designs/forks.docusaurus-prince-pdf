import * as NodeChildProcess from 'node:child_process'
import * as NodeFS from 'node:fs'
import * as NodePath from 'node:path'
import * as NodeUtil from 'node:util'
import { JSDOM } from 'jsdom'

import { Args as PrinceArgs } from './args/prince';
import { type Args as DocusaurusArgs } from './args/docusaurus';
import { IndexConfig } from './index.config'

const buffer = new Set()
const baseDir = import.meta.dir
const { values } = NodeUtil.parseArgs({
  args: Bun.argv,
  options: IndexConfig.options,
  strict: true,
  allowPositionals: true,
});

console.log('Parsed arguments:', values);

const 
  parsedUrl = new URL(values.pathUrl.replace(/\/$/, '')), 
  scope = parsedUrl.pathname, 
  scopeName = scope !== '/' ? `-${scope.replace(/\/$/g, '').replace(/^\//g, '').replace(/\//g, '-')}` : '';

const
  pathArgsPrince = NodePath.resolve(values.pathArgsPrince), 
  pathArgsDocusaurus = NodePath.resolve(values.pathArgsDocusaurus);

const 
  contentPrince = values.pathArgsPrince ? NodeFS.readFileSync(pathArgsPrince, ({ encoding: 'utf-8' })) : require('index.config.prince.default.json'),
  contentDocusaurus = values.pathArgsDocusaurus ? NodeFS.readFileSync(pathArgsDocusaurus, ({ encoding: 'utf-8' })) : require('index.config.docusaurus.default.json');
    
const 
  princeArgs: PrinceArgs = JSON.parse(contentPrince), 
  docusaurusArgs: DocusaurusArgs = JSON.parse(contentDocusaurus);

princeArgs.css ??= {}; princeArgs.css.styleSheet ??= `${baseDir}/print.css`;
princeArgs.input ??= {}; princeArgs.input.inputList ??= `${values.pathDirectoryOutput}/${parsedUrl.hostname}${scopeName}.txt`;
princeArgs.pdfOutput ??= {}; princeArgs.pdfOutput.outputFile ??= `${values.output || `${values.pathDirectoryOutput}/${parsedUrl.hostname}${scopeName}.pdf`}`;

if (docusaurusArgs.onlyPdf) { generatePdf() } 
else {
  if (values.pagesPrepend) {
    values.pagesPrepend.split(',').forEach(item => {
      const url = item.match(/^https?:\/\//) ? item : `${parsedUrl.origin}${scope}${item}`
      buffer.add(url)
      console.log(`Got link: ${url} [prepend]`)
    })
  }

  if (docusaurusArgs.includeIndex) {
    console.log(`Got link: ${parsedUrl.origin}${scope} [index]`)
    buffer.add(`${parsedUrl.origin}${scope}`)
  }

  requestPage(`${parsedUrl.origin}${scope}`)
}

async function generatePdf() {
  console.log(`Generating PDF ${princeArgs.pdfOutput?.outputFile}`)

  if (!values.pathArgsPrince && !values.dockerImagePrince) { executeCommand(`prince ${princeArgs}`) } 
  else {
    const 
      regex = "^([a-z0-9._-]+/[a-z0-9._-]+)(?::([a-zA-Z0-9_][a-zA-Z0-9._-]{0,127}))?$",
      dockerBase = 'config', 
      dockerImage = values.dockerImagePrince && new RegExp(regex).test(values.dockerImagePrince) 
        ? values.dockerImagePrince
        : "sparanoid/prince"; 
    
    princeArgs.css ??= {}; princeArgs.css.styleSheet = `/${dockerBase}/${princeArgs.css?.styleSheet}`;
    princeArgs.input ??= {}; princeArgs.input.inputList = `/${dockerBase}/${princeArgs.input?.inputList}`;
    princeArgs.pdfOutput ??= {}; princeArgs.pdfOutput.outputFile = `/${dockerBase}/${princeArgs.pdfOutput?.outputFile}`;

    executeCommand(`docker run --rm -i -v "${baseDir}/:/${dockerBase}" ${dockerImage} ${PrinceArgs.toCommand(princeArgs)}`)
  }
}

async function executeCommand(command: string) { 
  await new Promise((resolve, reject) => {  
    console.log(`Executing command: ${command}`)

    NodeChildProcess.exec(command, (error, stdout, stderr) => {
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