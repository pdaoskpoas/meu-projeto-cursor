// Declarações globais temporárias para resolver erros de tipo
import { ComponentType } from 'react';

declare module '@/components/ui/Breadcrumb' {
  export const Breadcrumb: ComponentType<{ className?: string; children?: React.ReactNode }>;
  export const BreadcrumbItem: ComponentType<{ className?: string; children?: React.ReactNode }>;
  export const BreadcrumbLink: ComponentType<{ className?: string; children?: React.ReactNode; href?: string }>;
  export const BreadcrumbList: ComponentType<{ className?: string; children?: React.ReactNode }>;
  export const BreadcrumbPage: ComponentType<{ className?: string; children?: React.ReactNode }>;
  export const BreadcrumbSeparator: ComponentType<{ className?: string; children?: React.ReactNode }>;
}
