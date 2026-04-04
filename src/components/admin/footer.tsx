export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-gradient-to-r from-background to-muted/20 py-8 px-4 md:px-6 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary/60"></div>
          <p>
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-semibold text-foreground">TCG Shop</span>.
            Todos os direitos reservados.
          </p>
        </div>
        <div className="flex gap-6">
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200 font-medium"
          >
            Suporte Loja
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200 font-medium"
          >
            Documentação
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200 font-medium"
          >
            Status
          </a>
        </div>
      </div>
    </footer>
  );
}
