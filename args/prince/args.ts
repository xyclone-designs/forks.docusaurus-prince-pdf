import { Flags } from "./flags";

export interface Args {
  logging?: {
    verbose?: boolean;
    debug?: boolean;
    logFile?: string;
    noWarnCssUnknown?: boolean;
    noWarnCssUnsupported?: boolean;
    noWarnCss?: boolean;
  };

  input?: {
    inputFormat?: "auto" | "html" | "xml";
    inputList?: string;
    baseUrl?: string;
    remap?: string;
    fileRoot?: string;
    iframes?: boolean;
    xInclude?: boolean;
    xmlExternalEntities?: boolean;
    xmlParseHuge?: boolean;
    noLocalFiles?: boolean;
  };

  network?: {
    noNetwork?: boolean;
    noRedirects?: boolean;
    authUser?: string;
    authPassword?: string;
    authServer?: string;
    authScheme?: string;
    authMethod?: "basic" | "digest" | "ntlm";
    authUrl?: string;
    noAuthPreemptive?: boolean;
    httpProxy?: string;
    httpTimeout?: number;
    cookie?: string;
    cookieFile?: string;

    sslCaCert?: string;
    sslCaPath?: string;
    sslCert?: string;
    sslCertType?: "PEM" | "DER";
    sslKey?: string;
    sslKeyType?: "PEM" | "DER";
    sslKeyPassword?: string;
    sslVersion?: string;
    sslNoRevoke?: boolean;
    noSslRevokeBestEffort?: boolean;
    insecure?: boolean;

    noParallelDownloads?: boolean;
  };

  javascript?: {
    enableJs?: boolean;
    scriptFile?: string;
    maxPasses?: number | "unlimited";
    princePdfScript?: string;
    princePdfEventScript?: string;
  };

  css?: {
    styleSheet?: string;
    media?: string;
    pageSize?: string;
    pageMargin?: string;
    noAuthorStyle?: boolean;
    noDefaultStyle?: boolean;
  };

  pdfOutput?: {
    outputFile?: string;
    pdfLang?: string;
    pdfProfile?: string;
    pdfOutputIntent?: string;

    attachFiles?: {
      attach?: string[];
      attachData?: string[];
      attachSource?: string[];
      attachAlternative?: string[];
      attachSupplement?: string[];
      attachUnspecified?: string[];
    };

    noArtificialFonts?: boolean;
    noEmbedFonts?: boolean;
    noSubsetFonts?: boolean;
    noSystemFonts?: boolean;
    noRenameDuplicateFonts?: boolean;
    forceIdentityEncoding?: boolean;

    noCompress?: boolean;
    noObjectStreams?: boolean;
    convertColors?: boolean;
    fallbackCmykProfile?: string;

    taggedPdf?: boolean;
    pdfForms?: boolean;
    cssDpi?: number;
  }
}

export namespace Args { 
  
  export function toArgs(options: Args, dockerBase?: string | undefined): string[] {
    const args: string[] = [];

    for (const [groupKey, group] of Object.entries(options)) {
      if (!group) continue;

      const flagGroup = (Flags as any)[groupKey];

      if (!flagGroup) continue;

      for (const [optionKey, value] of Object.entries(group)) {
        if (value === undefined || value === null) continue;

        const flag = flagGroup[optionKey];

        if (!flag) continue;

        const isDocker: boolean = dockerBase && ( 
          flag == Flags.css.styleSheet ||  
          flag == Flags.input.inputList ||  
          flag == Flags.pdfOutput.outputFile
        );

        // Boolean flag
        if (typeof value === "boolean") {
          if (value) args.push(flag);
          continue;
        }

        // Repeatable flag
        if (Array.isArray(value)) {
          value.forEach(v => {
            args.push(!isDocker ? `${flag}=${v}` : `${flag}=/${dockerBase}/${v}`);
          }); continue;
        }

        // Scalar value
        args.push(!isDocker ? `${flag}=${value}` : `${flag}=/${dockerBase}/${value}`);
      }
    }

    return args;
  }
  export function toCommandArgs(options: Args, dockerBase?: string | undefined): string { 
    return toArgs(options, dockerBase).join(" "); 
  }
}