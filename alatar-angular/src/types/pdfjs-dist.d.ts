declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: { workerSrc: string };
  export const version: string;
  export function getDocument(src: unknown): {
    promise: Promise<PDFDocumentProxy>;
  };

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }

  export interface PDFPageProxy {
    getViewport(opts: { scale: number }): { width: number; height: number };
    render(opts: {
      canvas?: HTMLCanvasElement;
      canvasContext: CanvasRenderingContext2D | null;
      viewport: { width: number; height: number };
    }): { promise: Promise<void> };
    cleanup(): void;
  }
}
