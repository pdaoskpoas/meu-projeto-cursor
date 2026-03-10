/// <reference types="vite/client" />

declare module '*.tsx' {
  const content: React.ComponentType;
  export default content;
}

declare module '*.ts' {
  const content: unknown;
  export default content;
}
