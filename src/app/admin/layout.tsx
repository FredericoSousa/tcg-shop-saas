import { Sidebar } from "@/components/admin/sidebar"
import { Navbar } from "@/components/admin/navbar"
import { Footer } from "@/components/admin/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { ReactNode } from "react"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr] bg-background font-sans antialiased text-foreground">
        <Sidebar />
        <div className="flex flex-col min-h-screen bg-muted/10">
          <Navbar />
          <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  )
}
