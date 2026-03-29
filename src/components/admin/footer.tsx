export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/10 py-6 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
        <p>
          &copy; {new Date().getFullYear()} TCG Shop. Todos os direitos reservados.
        </p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary transition-colors">Suporte Loja</a>
          <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
        </div>
      </div>
    </footer>
  )
}
