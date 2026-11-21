import { notFound } from "next/navigation";

/** Unknown /app/* URLs render the compact 404 inside the sidebar layout. */
export default function AppNotFoundCatchAll() {
  notFound();
}
