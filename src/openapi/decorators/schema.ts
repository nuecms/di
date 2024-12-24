import { getSchemaMeta, getOpenApiDoc } from '../meta';
import { SchemaDef } from '../types';


export async function registerSchema(
  target: any,
  name: string,
  schema: SchemaDef
): Promise<void> {
  const doc = getOpenApiDoc(target);
  const schemas = (doc.components.schemas = doc.components.schemas || {});
  schemas[name] = schema;
}

export function Schema(name?: string): ClassDecorator {
  return (target) => {
    const { properties, required } = getSchemaMeta(target.prototype);
    registerSchema(target, name || target.name, {
      type: 'object',
      properties,
      required,
    });
  };
}

interface PropertyDef {
  required?: boolean;
}

export function Property(opts: SchemaDef & PropertyDef): PropertyDecorator {
  return (target: any, key: string) => {
    const meta = getSchemaMeta(target);
    const properties = (meta.properties = meta.properties || {});
    const { required, ...schema } = opts;
    if (required) {
      meta.required = meta.required || [];
      meta.required.push(key);
    }
    properties[key] = schema;
  };
}
