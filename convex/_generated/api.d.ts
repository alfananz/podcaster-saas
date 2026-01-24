/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_debugNetwork from "../actions/debugNetwork.js";
import type * as actions_diagnose from "../actions/diagnose.js";
import type * as actions_enrich from "../actions/enrich.js";
import type * as actions_files from "../actions/files.js";
import type * as actions_process from "../actions/process.js";
import type * as actions_transcribe from "../actions/transcribe.js";
import type * as assets from "../assets.js";
import type * as clients from "../clients.js";
import type * as comments from "../comments.js";
import type * as debug from "../debug.js";
import type * as debugUser from "../debugUser.js";
import type * as episodes from "../episodes.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as media from "../media.js";
import type * as revisions from "../revisions.js";
import type * as users from "../users.js";
import type * as versions from "../versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/debugNetwork": typeof actions_debugNetwork;
  "actions/diagnose": typeof actions_diagnose;
  "actions/enrich": typeof actions_enrich;
  "actions/files": typeof actions_files;
  "actions/process": typeof actions_process;
  "actions/transcribe": typeof actions_transcribe;
  assets: typeof assets;
  clients: typeof clients;
  comments: typeof comments;
  debug: typeof debug;
  debugUser: typeof debugUser;
  episodes: typeof episodes;
  files: typeof files;
  http: typeof http;
  media: typeof media;
  revisions: typeof revisions;
  users: typeof users;
  versions: typeof versions;
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
