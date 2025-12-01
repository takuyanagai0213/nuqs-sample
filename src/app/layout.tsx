import { Suspense } from 'react'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export const metadata = {
  title: 'nuqs Sample',
  description: 'URL state management sample with nuqs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <NuqsAdapter>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </NuqsAdapter>
      </body>
    </html>
  )
}
