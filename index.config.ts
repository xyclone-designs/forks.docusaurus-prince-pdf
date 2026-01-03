import { type ParseArgsOptionsConfig } from "node:util";

export interface IndexParseArgsOptionsConfig extends ParseArgsOptionsConfig { 
  dockerImagePrince: {
    type: 'string',
    default: 'sparanoid/prince',
  },

  pathArgsDocusaurus: {
    type: 'string',
    default: 'index.config.docusaurus.default.json',
  },
  pathArgsPrince: {
    type: 'string',
    default: 'index.config.prince.default.json',
  },
  pathUrl: {
    type: 'string', },

  pagesAppend: { type: 'string', },
  pagesPrepend: { type: 'string', },
}

export class IndexConfig {
  static readonly options: IndexParseArgsOptionsConfig = {
    dockerImagePrince: {
      type: 'string',
      default: 'yeslogic/prince',
    },
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
      default: 'https://dev.openbayes.com/docs',
    },
    pagesAppend: {
      type: 'string',
    },
    pagesPrepend: {
      type: 'string'
    },
  } as IndexParseArgsOptionsConfig;
}