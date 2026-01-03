import { type ParseArgsOptionsConfig } from "node:util";

export interface IndexConfig extends ParseArgsOptionsConfig { 
  dockerImagePrince: {
    type: 'string',
    default: 'sparanoid/prince',
    short: 'princeDocker',
  },

  pathArgsDocusaurus: {
    type: 'string',
    short: 'docusaurusArgs',
  },
  pathArgsPrince: {
    type: 'string',
    short: 'princeArgs',
  },
  pathUrl: {
    type: 'string',
    short: 'url',
    default: 'https://dev.openbayes.com/docs',
  },

  pagesAppend: {
    type: 'string',
    default: '',
  },
  pagesPrepend: {
    type: 'string',
    default: '',
  },
}  
