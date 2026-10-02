/** Resolve extensionless imports from the library's bundler-oriented build. */
export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !specifier.endsWith('.js') && context.parentURL?.includes('/dist/engine/')) {
    return nextResolve(`${specifier}.js`, context);
  }
  return nextResolve(specifier, context);
}
