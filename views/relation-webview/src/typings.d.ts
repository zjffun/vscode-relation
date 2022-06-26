declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vscode-button": any;
      "vscode-text-field": any;
      "vscode-text-area": any;
    }
  }
  interface Window {
    i18nText: {
      [key: string]: string;
    };
  }
}

export {};
