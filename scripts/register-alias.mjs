// Registers ./alias-loader.mjs — see that file. Used via `--import`.
import { register } from "node:module";
register("./alias-loader.mjs", import.meta.url);
