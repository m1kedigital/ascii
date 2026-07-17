"use client";

/**
 * Legacy entry — app shell lives in AsciiApp.
 * Re-export settings type for any residual imports.
 */
export type { AsciiSettings } from "@/lib/types";
export { default } from "./AsciiApp";
