import * as pdfjsLib from 'pdfjs-dist';
// The `?url` suffix tells Vite to emit this as a static asset and give us
// its final URL, rather than trying to bundle the worker into the main chunk.
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export { pdfjsLib };
