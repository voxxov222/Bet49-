import React, { useEffect, useRef } from 'react';

export default function GistEmbed({ gistId }: { gistId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let iframeDocument = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
    if (iframeDocument) {
      const html = `
        <html>
          <head>
            <base target="_parent">
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: transparent; 
                color-scheme: dark;
              }
              .gist .color-bg-default {
                background-color: transparent !important;
              }
            </style>
          </head>
          <body>
            <script type="text/javascript" src="https://gist.github.com/${gistId}.js"></script>
          </body>
        </html>
      `;
      iframeDocument.open();
      iframeDocument.write(html);
      iframeDocument.close();
    }
  }, [gistId]);

  return (
    <iframe
      ref={iframeRef}
      width="100%"
      style={{ border: 'none', minHeight: '600px' }}
      title={`Github Gist ${gistId}`}
      className="rounded-xl bg-slate-900 border border-slate-800"
    />
  );
}
