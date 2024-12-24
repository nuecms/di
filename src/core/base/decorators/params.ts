import { paramDecoratorFactory, Validator } from '../..';
import { ParameterType } from '../helpers';

export function Body(paramName?: string, paramValidator?: Validator) {
  return paramDecoratorFactory({
    paramName,
    paramType: ParameterType.BODY,
    paramValidator,
  });
}

export function Cookies(paramName?: string, paramValidator?: Validator) {
  return paramDecoratorFactory({
    paramName,
    paramType: ParameterType.COOKIE,
    paramValidator,
  });
}

export function Headers(paramName?: string, paramValidator?: Validator) {
  return paramDecoratorFactory({
    paramName,
    paramType: ParameterType.HEADER,
    paramValidator,
  });
}

export function Params(paramName?: string, paramValidator?: Validator) {
  return paramDecoratorFactory({
    paramName,
    paramType: ParameterType.PARAM,
    paramValidator,
  });
}

export function Query(paramName?: string, paramValidator?: Validator) {
  return paramDecoratorFactory({
    paramName,
    paramType: ParameterType.QUERY,
    paramValidator,
  });
}

export function Request(paramName?: string) {
  return paramDecoratorFactory({
    paramName,
    paramType: ParameterType.REQUEST,
  });
}

export function Response(paramName?: string) {
  return paramDecoratorFactory({
    paramName,
    paramType: ParameterType.RESPONSE,
  });
}


export const Req = Request;


export const Res = Response;


export function Next() {
  return paramDecoratorFactory({
    paramType: ParameterType.NEXT,
  });
}


