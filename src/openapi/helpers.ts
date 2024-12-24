import { InjectionToken } from '../di';
import { Container } from '../core/container';
import { Express } from 'express';
import * as swaggerUi from 'swagger-ui-express';

import { OpenApiOptions, SchemaDef } from './types';

export const OPENAPI_DOCUMENT = new InjectionToken('openapi_doc');
export async function getOpenApiDoc() {
  try {
    return await Container.get(OPENAPI_DOCUMENT);
  } catch (_error) {
    const doc: any = {
      openapi: '3.0.3',
      tags: [],
      paths: {},
      security: [],
      components: {},
    };

    Container.provide([
      {
        provide: OPENAPI_DOCUMENT,
        useValue: doc,
      },
    ]);

    return doc;
  }
}


export async function registerSchema(
  name: string,
  schema: SchemaDef
): Promise<void> {
  const doc = await getOpenApiDoc();
  const schemas = (doc.components.schemas = doc.components.schemas || {});

  schemas[name] = schema;
}
