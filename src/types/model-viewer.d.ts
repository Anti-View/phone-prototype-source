/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string
        'camera-controls'?: string
        'touch-action'?: string
        'disable-zoom'?: string
        'auto-rotate'?: string
      },
      HTMLElement
    >
  }
}
