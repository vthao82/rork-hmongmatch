export function redirectSystemPath(args: { path: string; initial: boolean }) {
  return args.initial ? "/" : args.path;
}
