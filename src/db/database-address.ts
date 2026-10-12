const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const DEFAULT_PORT = "5432";

export function pointsAtThisComputer(url: string | undefined): boolean {
  if (!url || !URL.canParse(url)) return false;
  return LOCAL_HOSTS.includes(new URL(url).hostname);
}

/** The name of the database an address points at. */
export function databaseNameOf(url: string): string {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}

function serverOf(url: string): string {
  const { hostname, port } = new URL(url);
  const host = LOCAL_HOSTS.includes(hostname) ? "localhost" : hostname;
  return `${host}:${port || DEFAULT_PORT}`;
}

/** Whether two addresses reach the same database on the same server. */
export function sameDatabase(first: string, second: string): boolean {
  if (!URL.canParse(first) || !URL.canParse(second)) return false;
  return (
    serverOf(first) === serverOf(second) &&
    databaseNameOf(first) === databaseNameOf(second)
  );
}
