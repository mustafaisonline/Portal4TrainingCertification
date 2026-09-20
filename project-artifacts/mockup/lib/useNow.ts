import { useEffect, useState } from "react";

/** The current time, or `null` until the component has mounted. Certificate
 *  status depends on today's date, and the static export is built on a
 *  different day than it is viewed — computing it during render would bake the
 *  build date into the HTML and mismatch on hydration. Callers render a
 *  placeholder while this is null. */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);
  return now;
}
