import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>
        <h1>Page not found</h1>
        <p>
          <Link href="/en">Go to the home page</Link>
        </p>
      </body>
    </html>
  );
}
