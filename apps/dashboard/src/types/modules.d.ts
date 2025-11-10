// Module type declarations for missing type definitions

declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename?: string, options?: any): void;
}

declare module 'crypto-js' {
  export const AES: any;
  export const SHA256: any;
  export const enc: any;
  export const lib: any;
}

declare module 'vue-img-cutter' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'nprogress' {
  export function start(): void;
  export function done(): void;
  export function configure(options: { showSpinner?: boolean }): void;
}

declare module '@wangeditor/editor-for-vue' {
  import { DefineComponent } from 'vue';
  export const Editor: DefineComponent<{}, {}, any>;
  export const Toolbar: DefineComponent<{}, {}, any>;
}

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

export { };