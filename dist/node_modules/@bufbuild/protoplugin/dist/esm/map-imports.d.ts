/**
 * A configuration for mapping imports of generated code to a package, for
 * example a generated SDK published to a package registry.
 *
 * All plugins based on @bufbuild/protoplugin support the option
 * "map_imports", which is parsed into this type. The option can be given
 * multiple times, in the form of `map_imports=<pattern>:<target>`.
 *
 * The pattern is matched against the path of the Protobuf file, for example
 * `google/rpc/status.proto`, using a reduced subset of glob:
 * - `*` matches zero or more characters except `/`.
 * - `**` matches zero or more characters, including `/`.
 * - `**\/` (escaped for block comment!) matches zero or more path elements,
 *   where an element is one or more characters with a trailing `/`.
 * - A trailing `/` matches every file in the directory and its
 *   subdirectories.
 *
 * The target is typically a npm package name, for example `@scope/pkg`.
 *
 * If a generated file imports from a Protobuf file matching one of the
 * patterns, the import path is derived from the target instead of the local
 * output, by prepending the target to the generated file path. The first
 * matching pattern wins.
 *
 * For example, the option `map_imports=google/rpc/:@scope/pkg` imports
 * `google/rpc/status.proto` from `@scope/pkg/google/rpc/status_pb.js`.
 *
 * Well-known types are always imported from the runtime package, unless they
 * are generated, and are not subject to this option.
 */
export type MapImports = {
    pattern: string;
    target: string;
}[];
/**
 * Patterns of `MapImports` compiled to regular expressions to read during codegen.
 */
export type CompiledMapImports = {
    pattern: RegExp;
    target: string;
}[];
/**
 * Compile the patterns of the given `MapImports`.
 */
export declare function compileMapImports(mapImports: MapImports): CompiledMapImports;
/**
 * Return the target for the given Protobuf file path, or undefined if none of
 * the patterns match.
 */
export declare function mapImportTarget(protoFileName: string, mapImports: CompiledMapImports): string | undefined;
