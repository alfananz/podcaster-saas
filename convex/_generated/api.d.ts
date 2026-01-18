/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_enrich from "../actions/enrich.js";
import type * as actions_process from "../actions/process.js";
import type * as actions_transcribe from "../actions/transcribe.js";
import type * as assets from "../assets.js";
import type * as comments from "../comments.js";
import type * as episodes from "../episodes.js";
import type * as files from "../files.js";
import type * as media from "../media.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/enrich": typeof actions_enrich;
  "actions/process": typeof actions_process;
  "actions/transcribe": typeof actions_transcribe;
  assets: typeof assets;
  comments: typeof comments;
  episodes: typeof episodes;
  files: typeof files;
  media: typeof media;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
