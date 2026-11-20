"use client";

import { useEffect, useState } from "react";
import { getJSON } from "@/lib/api";

const RETRY_MS = 3000;
const MAX_RETRIES = 60; // about three minutes: long enough for a sleeping free server to wake

/** Loads JSON from the API. While the server is unreachable or waking (network error, 502/503/504)
 *  it keeps retrying and reports `waking`, instead of failing on the first try. */
export function useJSON<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    setData(null);
    setError("");
    setWaking(false);
    const load = () =>
      getJSON<T>(path)
        .then((d) => {
          if (!alive) return;
          setData(d);
          setWaking(false);
        })
        .catch((e: Error) => {
          if (!alive) return;
          const transient = e instanceof TypeError || /^(502|503|504) /.test(e.message);
          if (transient && attempt < MAX_RETRIES) {
            attempt += 1;
            setWaking(true);
            timer = setTimeout(load, RETRY_MS);
          } else {
            setWaking(false);
            setError(e.message);
          }
        });
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [path]);

  return { data, error, waking };
}
