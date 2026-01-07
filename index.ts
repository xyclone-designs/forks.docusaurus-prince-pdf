import * as NodeChildProcess from 'node:child_process'
import * as NodeFS from 'node:fs'
import * as NodePath from 'node:path'
import * as NodeUtil from 'node:util'
import { URL } from 'url'

import axios from 'axios'
import * as cheerio from 'cheerio'

import { Args as PrinceArgs } from './args/prince';
import { Args as DocusaurusArgs } from './args/docusaurus';

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
      default: 'http://localhost:3000',
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
  parsedUrl = new URL(values.pathUrl.replace(/\/$/, '').replace("localhost", "host.docker.internal")), 
  scopeName = parsedUrl.pathname !== '/' ? `-${parsedUrl.pathname.replace(/\/$/g, '').replace(/^\//g, '').replace(/\//g, '-')}` : '';
 
princeArgs.css ??= {}; princeArgs.css.styleSheet ??= `print.css`;
princeArgs.input ??= {}; princeArgs.input.inputList ??= `${docusaurusArgs.directoryOutput}/${parsedUrl.hostname}${scopeName}.txt`;
princeArgs.pdfOutput ??= {}; princeArgs.pdfOutput.outputFile ??= `${docusaurusArgs.directoryOutput}/${parsedUrl.hostname}${scopeName}.pdf`;

if (docusaurusArgs.onlyPdf) generatePdf();
else await crawlNavLinks(`${parsedUrl.origin}${parsedUrl.pathname}`, `${parsedUrl.origin}${parsedUrl.pathname}`)
  .then(async () => {
    console.log('--- Discovery Complete ---');
    console.log(`Found ${buffer.size} unique pages:`);
    
    if (princeArgs.input?.inputList) await Bun.write(princeArgs.input.inputList, [...buffer].join('\n'));

    generatePdf();
  });

async function generatePdf() {
  if (!values.pathArgsPrince && !docusaurusArgs.dockerImagePrince) { executeCommand(`prince ${princeArgs}`) } 
  else {
    let dockerBase = 'config', port = undefined, command = [
      `docker run --rm --entrypoint=prince`,
    ];

    if (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1") {
      command.push(`--expose ${parsedUrl.port}`);
      command.push("--add-host=host.docker.internal:host-gateway");
    }

    executeCommand([
      ... command,
      `-v "${baseDir}/:/${dockerBase}"`,
      docusaurusArgs.dockerImagePrince,
      PrinceArgs.toCommandArgs(princeArgs, dockerBase),
      "--verbose --no-warn-css"
    ].join(' '));
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
    });
    
  }).catch(err => { throw new Error(err) });   
}

async function crawlNavLinks(currentUrl: string, baseUrl: string): Promise<void> {
  const normalizedUrl = currentUrl.replace(/\/$/, "").replace(/(#.*$)|(\/+$)/g, '');
  const baseNormalizedUrl = baseUrl.replace(/\/$/, "");

  if (buffer.has(normalizedUrl)) return;
  if (regExpFile.test(normalizedUrl)) return;
  if (!normalizedUrl.startsWith(baseUrl) && normalizedUrl != baseNormalizedUrl) return;

  console.log(`Crawling: ${normalizedUrl}`); 
  
  buffer.add(normalizedUrl);

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
        crawlNavLinks(link, baseUrl)
          .finally();
  } catch (error) {
      console.error(`Failed to crawl ${normalizedUrl}:`, error instanceof Error ? error.message : error);
  }
}