type Options = {
  unsafe?: boolean,
  flat?: boolean,
  expose?: boolean,
  defaultName?: string,
  defaultMessage?: string,
};

export default function serializeHttpError(
  error: unknown,
  options: Options
): {name: string, message: string};
