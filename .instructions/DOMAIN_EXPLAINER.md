# Domínio de Negócio: Trading Card Games (TCG)

## Glossário para a IA
- **Card Template:** A definição da carta (Ex: "Black Lotus" da edição "Alpha"). É global.
- **Inventory Item:** A unidade física que o lojista possui. Tem Estado (Condition), Idioma (Language) e Preço.
- **Set (Edição):** Conjunto ao qual a carta pertence. Identificado por um código de 3 letras (Ex: 'MTG', 'ZEN').
- **Foil:** Cartas com brilho especial. Valem mais e devem ser tratadas como um booleano no estoque.

## Regras de Estado de Conservação (Condição)
Siga o padrão internacional:
- NM (Near Mint): Perfeita ou quase perfeita.
- SP (Slightly Played): Sinais leves de uso.
- MP (Moderately Played): Desgaste visível.
- HP (Heavily Played): Muito gasta, mas jogável.
- D (Damaged): Danificada.