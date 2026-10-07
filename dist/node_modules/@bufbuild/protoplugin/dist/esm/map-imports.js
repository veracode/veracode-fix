// Copyright 2021-2026 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * Compile the patterns of the given `MapImports`.
 */
export function compileMapImports(mapImports) {
    return mapImports.map(({ pattern, target }) => {
        return {
            pattern: globToRegExp(pattern),
            target: target.endsWith("/") ? target.slice(0, -1) : target,
        };
    });
}
/**
 * Return the target for the given Protobuf file path, or undefined if none of
 * the patterns match.
 */
export function mapImportTarget(protoFileName, mapImports) {
    for (const { pattern, target } of mapImports) {
        if (pattern.test(protoFileName)) {
            return target;
        }
    }
    return undefined;
}
function globToRegExp(glob) {
    const r = ["^"];
    for (let i = 0; i < glob.length; i++) {
        switch (glob[i]) {
            case "*":
                if (glob[i + 1] === "*") {
                    if (glob[i + 2] === "/") {
                        i += 2;
                        r.push("([^\\/]+\\/)*");
                        break;
                    }
                    i += 1;
                    r.push(".*");
                    break;
                }
                r.push("[^\\/]*");
                break;
            case "/":
                if (i === glob.length - 1) {
                    // A trailing slash matches everything in the directory.
                    r.push("\\/.*");
                    break;
                }
                r.push("\\/");
                break;
            case ".":
            case "+":
            case "?":
            case "^":
            case "$":
            case "{":
            case "}":
            case "(":
            case ")":
            case "|":
            case "[":
            case "]":
            case "\\":
                r.push("\\", glob[i]);
                break;
            default:
                r.push(glob[i]);
                break;
        }
    }
    r.push("$");
    return new RegExp(r.join(""));
}
