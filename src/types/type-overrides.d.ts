// Type overrides para resolver incompatibilidades temporárias

declare module '@/components/ui/breadcrumb' {
  import { FC, ReactNode } from 'react';
  
  export const Breadcrumb: FC<{ children?: ReactNode; className?: string }>;
  export const BreadcrumbList: FC<{ children?: ReactNode; className?: string }>;
  export const BreadcrumbItem: FC<{ children?: ReactNode; className?: string }>;
  export const BreadcrumbLink: FC<{ children?: ReactNode; className?: string; href?: string }>;
  export const BreadcrumbPage: FC<{ children?: ReactNode; className?: string }>;
  export const BreadcrumbSeparator: FC<{ children?: ReactNode; className?: string }>;
}

declare module '@/components/ui/Breadcrumb' {
  export * from '@/components/ui/breadcrumb';
}
