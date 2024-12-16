import { ClassConstructor, Injectable } from '../types';
import { DEP_IDS_METADATA } from '../constants';

export function Inject(injectable: Injectable) {
  return (
    target: ClassConstructor,
    _propertyKey: string | symbol,
    parameterIndex: number
  ) => {

    const t = target
    const ids = Reflect.getMetadata(DEP_IDS_METADATA, t) ?? [];

    ids[parameterIndex] = injectable;

    Reflect.defineMetadata(DEP_IDS_METADATA, ids, t);
  };
}
