import { Handler, Metadata } from '..';

export interface RouteMetadata extends Metadata {
  status?: number;
}

export interface AdapterRoute {
  handler: Handler;
  type: string;
  url: string;
}
