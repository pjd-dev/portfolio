// app/engine-client.tsx
"use client";
import { useEffect } from "react";
import { flagEngine } from "@/lib/engine";

export default function EngineClient() {
  useEffect(flagEngine, []);
  return null;
}
