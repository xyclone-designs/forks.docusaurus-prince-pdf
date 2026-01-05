import * as NodeChildProcess from 'node:child_process'
import * as NodeFS from 'node:fs'
import * as NodePath from 'node:path'
import * as NodeUtil from 'node:util'
import { JSDOM } from 'jsdom'
import { URL } from 'url'

import axios from 'axios'
import * as cheerio from 'cheerio'

import { Args as PrinceArgs } from './args/prince';
import { type Args as DocusaurusArgs } from './args/docusaurus';

const regExpFile = new RegExp('/\.(pdf|zip|gz|tar|png|jpe?g|gif|svg|webp|mp4|mov|exe|dmg|txt|bin|csv|xlsx?|docx?)$/i');

const buffer = new Set()
const baseDir = import.meta.dir
const { values } = NodeUtil.parseArgs({
  args: Bun.argv,
  options: {
    pathArgsDocusaurus: {
      type: 'string',
      default: 'index.config.docusaurus.default.json',
    },
    pathArgsPrince: {
      type: 'string',
      default: 'index.config.prince.default.json',
    },
    pathUrl: {
      type: 'string',
      default: 'http://localhost:4321',
    }
  },
  strict: true,
  allowPositionals: true,
});

console.log('Parsed arguments:', values);

const
  pathArgsPrince = NodePath.resolve(values.pathArgsPrince), 
  pathArgsDocusaurus = NodePath.resolve(values.pathArgsDocusaurus);

console.log('pathArgsPrince:', pathArgsPrince);
console.log('pathArgsDocusaurus:', pathArgsDocusaurus);

const 
  contentPrince = values.pathArgsPrince ? NodeFS.readFileSync(pathArgsPrince, ({ encoding: 'utf-8' })) : require('index.config.prince.default.json'),
  contentDocusaurus = values.pathArgsDocusaurus ? NodeFS.readFileSync(pathArgsDocusaurus, ({ encoding: 'utf-8' })) : require('index.config.docusaurus.default.json');
    
const 
  princeArgs: PrinceArgs = JSON.parse(contentPrince), 
  docusaurusArgs: DocusaurusArgs = JSON.parse(contentDocusaurus);

const 
  parsedUrl = new URL(values.pathUrl.replace(/\/$/, '')), 
  scope = parsedUrl.pathname, 
  scopeName = scope !== '/' ? `-${scope.replace(/\/$/g, '').replace(/^\//g, '').replace(/\//g, '-')}` : '';

princeArgs.css ??= {}; princeArgs.css.styleSheet ??= `${baseDir}/print.css`;
princeArgs.input ??= {}; princeArgs.input.inputList ??= `${docusaurusArgs.directoryOutput}/${parsedUrl.hostname}${scopeName}.txt`;
princeArgs.pdfOutput ??= {}; princeArgs.pdfOutput.outputFile ??= `${docusaurusArgs.directoryOutput}/${parsedUrl.hostname}${scopeName}.pdf`;

if (docusaurusArgs.onlyPdf) { generatePdf() } 
else if (true) 
  crawlNavLinks(`${parsedUrl.origin}${scope}`, `${parsedUrl.origin}${scope}`)
    .then(allLinks => {
      console.log('--- Discovery Complete ---');
      console.log(`Found ${allLinks.size} unique pages:`);
      buffer.union(allLinks);

      generatePdf();
    });
else {
  if (docusaurusArgs.pagesPrepend) {
    docusaurusArgs.pagesPrependValues.split(',').forEach(item => {
      const url = item.match(/^https?:\/\//) ? item : `${parsedUrl.origin}${scope}${item}`
      buffer.add(url)
      console.log(`Got link: ${url} [prepend]`)
    })
  }

  if (docusaurusArgs.includeIndex) {
    console.log(`Got link: ${parsedUrl.origin}${scope} [index]`)
    buffer.add(`${parsedUrl.origin}${scope}`)
  }

  requestPage(`${parsedUrl.origin}${scope}`);
}

async function generatePdf() {
  console.log(`Generating PDF ${princeArgs.pdfOutput?.outputFile}`)

  if (!values.pathArgsPrince && !docusaurusArgs.dockerImagePrince) { executeCommand(`prince ${princeArgs}`) } 
  else {
    const dockerBase = 'config'; 
    
    princeArgs.css ??= {}; princeArgs.css.styleSheet = `/${dockerBase}/${princeArgs.css?.styleSheet}`;
    princeArgs.input ??= {}; princeArgs.input.inputList = `/${dockerBase}/${princeArgs.input?.inputList}`;
    princeArgs.pdfOutput ??= {}; princeArgs.pdfOutput.outputFile = `/${dockerBase}/${princeArgs.pdfOutput?.outputFile}`;

    executeCommand(`docker run --rm -i -v "${baseDir}/:/${dockerBase}" ${docusaurusArgs.dockerImagePrince} ${PrinceArgs.toCommand(princeArgs)}`)
  }
}

async function executeCommand(command: string) { 
  await new Promise((resolve, reject) => {  
    console.log(`Executing command: ${command}`);

    NodeChildProcess.exec(command, (error, stdout, stderr) => {
      if (error) 
        return reject(error);
      
      stdout ?? console.log(`Done: ${stdout}`);
      stderr ?? console.log(`Error: ${stderr}`);

      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    })
    
  }).catch(err => { throw new Error(err) });   
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
    } 
    else {
      if (cycle) console.log(`Pagination cycle detected on ${url}`);
      else console.log('No next link found!');

      if (docusaurusArgs.pagesAppend) docusaurusArgs.pagesAppendValues
        .split(',')
        .forEach(async item => {
          const url = item.match(/^https?:\/\//) ? item : `${parsedUrl.origin}${scope}${item}`;
          buffer.add(url);
          console.log(`Got link: ${url} [append]`);
        });

      if (buffer.size > 0 && princeArgs.input?.inputList) {
        console.log(`Writing buffer (${buffer.size} links) to ${princeArgs.input.inputList}`)
        await Bun.write(princeArgs.input.inputList, [...buffer].join('\n'))

        if (!docusaurusArgs.onlyList) {
          generatePdf()
        }
      } else console.log('No buffer to write!');
    }
  } catch (err) { console.error('Error fetching page:', err); }
}

async function crawlNavLinks(currentUrl: string, baseUrl: string, visited: Set<string> = new Set()): Promise<Set<string>> {
  const normalizedUrl = currentUrl.replace(/\/$/, "").replace(/(#.*$)|(\/+$)/g, '');
  const baseNormalizedUrl = baseUrl.replace(/\/$/, "");

  if (visited.has(normalizedUrl)) return visited;
  if (regExpFile.test(normalizedUrl)) return visited;
  if (!normalizedUrl.startsWith(baseUrl) && normalizedUrl != baseNormalizedUrl) return visited;

  console.log(`Crawling: ${normalizedUrl}`);
  visited.add(normalizedUrl);

  try {
      const { data } = await axios.get(normalizedUrl);
      const $ = cheerio.load(data);
      const internalLinks: string[] = [];

      $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
              try {
                  const absoluteUrl = new URL(href, normalizedUrl).href.replace(/\/$/, "");
                                    
                  if (absoluteUrl.startsWith(baseUrl)) 
                    internalLinks.push(absoluteUrl);
              } catch (e) { }
          }
      });

      for (const link of internalLinks) 
        crawlNavLinks(link, baseUrl, visited)
          .finally();
  } catch (error) {
      console.error(`Failed to crawl ${normalizedUrl}:`, error instanceof Error ? error.message : error);
  }

  return visited;
}