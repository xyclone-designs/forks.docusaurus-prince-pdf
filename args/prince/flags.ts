export const Flags = {
  logging: {
    verbose: "--verbose",
    debug: "--debug",
    logFile: "--log",
    noWarnCssUnknown: "--no-warn-css-unknown",
    noWarnCssUnsupported: "--no-warn-css-unsupported",
    noWarnCss: "--no-warn-css"
  },

  input: {
    inputFormat: "--input",
    inputList: "--input-list",
    baseUrl: "--baseurl",
    remap: "--remap",
    fileRoot: "--fileroot",
    iframes: "--iframes",
    xInclude: "--xinclude",
    xmlExternalEntities: "--xml-external-entities",
    xmlParseHuge: "--xml-parse-huge",
    noLocalFiles: "--no-local-files"
  },

  network: {
    noNetwork: "--no-network",
    noRedirects: "--no-redirects",
    authUser: "--auth-user",
    authPassword: "--auth-password",
    authServer: "--auth-server",
    authScheme: "--auth-scheme",
    authMethod: "--auth-method",
    authUrl: "--auth",
    noAuthPreemptive: "--no-auth-preemptive",
    httpProxy: "--http-proxy",
    httpTimeout: "--http-timeout",
    cookie: "--cookie",
    cookieFile: "--cookie-file",

    sslCaCert: "--ssl-cacert",
    sslCaPath: "--ssl-capath",
    sslCert: "--ssl-cert",
    sslCertType: "--ssl-cert-type",
    sslKey: "--ssl-key",
    sslKeyType: "--ssl-key-type",
    sslKeyPassword: "--ssl-key-password",
    sslVersion: "--ssl-version",
    sslNoRevoke: "--ssl-no-revoke",
    noSslRevokeBestEffort: "--no-ssl-revoke-best-effort",
    insecure: "--insecure",
    noParallelDownloads: "--no-parallel-downloads"
  },

  javascript: {
    enableJs: "--javascript",
    scriptFile: "--script",
    maxPasses: "--max-passes",
    princePdfScript: "--prince-pdf-script",
    princePdfEventScript: "--prince-pdf-event-script"
  },

  css: {
    styleSheet: "--style",
    media: "--media",
    pageSize: "--page-size",
    pageMargin: "--page-margin",
    noAuthorStyle: "--no-author-style",
    noDefaultStyle: "--no-default-style"
  },

  pdfOutput: {
    outputFile: "--output",
    pdfLang: "--pdf-lang",
    pdfProfile: "--pdf-profile",
    pdfOutputIntent: "--pdf-output-intent",

    noArtificialFonts: "--no-artificial-fonts",
    noEmbedFonts: "--no-embed-fonts",
    noSubsetFonts: "--no-subset-fonts",
    noSystemFonts: "--no-system-fonts",
    noRenameDuplicateFonts: "--no-rename-duplicate-fonts",
    forceIdentityEncoding: "--force-identity-encoding",

    noCompress: "--no-compress",
    noObjectStreams: "--no-object-streams",
    convertColors: "--convert-colors",
    fallbackCmykProfile: "--fallback-cmyk-profile",

    taggedPdf: "--tagged-pdf",
    pdfForms: "--pdf-forms",
    cssDpi: "--css-dpi"
  },

  pdfMetadata: {
    title: "--pdf-title",
    subject: "--pdf-subject",
    author: "--pdf-author",
    keywords: "--pdf-keywords",
    creator: "--pdf-creator",
    xmpFile: "--pdf-xmp",
    xmpMetadata: "--pdf-xmp-metadata"
  },

  pdfEncryption: {
    encrypt: "--encrypt",
    keyBits: "--key-bits",
    userPassword: "--user-password",
    ownerPassword: "--owner-password",
    disallowPrint: "--disallow-print",
    disallowCopy: "--disallow-copy",
    allowCopyForAccessibility: "--allow-copy-for-accessibility",
    disallowAnnotate: "--disallow-annotate",
    disallowModify: "--disallow-modify",
    allowAssembly: "--allow-assembly"
  },

  rasterOutput: {
    rasterOutput: "--raster-output",
    rasterFormat: "--raster-format",
    jpegQuality: "--raster-jpeg-quality",
    rasterPages: "--raster-pages",
    rasterDpi: "--raster-dpi",
    rasterThreads: "--raster-threads",
    rasterBackground: "--raster-background"
  },

  utility: {
    scanFonts: "--scanfonts",
    fontSpecimen: "--font-specimen"
  },

  advanced: {
    httpHeader: "--http-header",
    userAgent: "--user-agent",
    shell: "--shell",
    capture: "--capture",
    replay: "--replay",
    control: "--control",
    jobFile: "--job",

    structuredLog: "--structured-log",
    noStructuredLog: "--no-structured-log",

    failDroppedContent: "--fail-dropped-content",
    failMissingResources: "--fail-missing-resources",
    failIncorrectReferences: "--fail-incorrect-references",
    failStrippedTransparency: "--fail-stripped-transparency",
    failMissingGlyphs: "--fail-missing-glyphs",
    failPdfProfileError: "--fail-pdf-profile-error",
    failPdfTagError: "--fail-pdf-tag-error",
    failInvalidLicense: "--fail-invalid-license",
    failSafe: "--fail-safe"
  }
} as const;