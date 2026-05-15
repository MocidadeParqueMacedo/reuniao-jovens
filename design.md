# Design — Reunião de Jovens

## Visão Geral

App de gerenciamento de reuniões de jovens de uma congregação religiosa. Fiel ao HTML original: mesmas abas, mesmas funcionalidades, mesma lógica de dados via AsyncStorage.

---

## Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| primary | #4f46e5 (indigo) | Botões, destaques, cabeçalho |
| primary-dark | #3730a3 | Hover/pressed |
| primary-light | #818cf8 | Bordas, secundário |
| accent | #f59e0b | Aniversário, próxima reunião |
| background | #f1f5f9 | Fundo geral |
| surface | #ffffff | Cards |
| foreground | #1e293b | Texto principal |
| muted | #64748b | Texto secundário |
| border | #e2e8f0 | Divisórias |
| success | #22c55e | Presença marcada |
| danger | #ef4444 | Excluir, erro |

---

## Telas (Abas)

### 1. Eventos (tab inicial)
- Calendário anual com navegação de ano (‹ ›)
- Mini-calendários mensais com pontos coloridos (aniversário, evento, reunião, visita)
- Painel de detalhe do dia ao clicar
- Lista de Próximos Eventos com botão "+ Adicionar"

### 2. Histórico
- Filtros: ano, tipo de período (semestre/trimestre/bimestre/datas), grupo, subgrupo, continuação, tipo de membro
- Lista de reuniões com contagem de presentes
- Tela de detalhe de presença (chamada) com toggle por membro
- Suporte a visitantes por reunião
- Gráficos de linha e barra (Chart.js → react-native-chart-kit)

### 3. Aniversários
- Lista de próximos aniversários com dias restantes

### 4. Membros
- Menu principal: Irmãos, Irmãs, Crianças, Mocidade, Todos
- Submenus por continuação
- Busca global
- Modal de novo membro com foto (galeria/câmera), nome, gênero, continuação, nascimento, telefone, flag auxiliar

### 5. Visitas
- Menu: Agendar Visita, Histórico de Visitas, Para Comuns
- Formulário de agendamento com data, hora, nome, endereço, observações
- Detalhe da visita

### 6. Atas
- Lista de atas com data, auxiliares, resumo do assunto
- Modal de nova ata: data, auxiliares (checkboxes), assunto (texto/documento/foto)
- Detalhe da ata

### 7. Versinhos
- Lista de reuniões com recitativos
- Modal de novo recitativo: data, livro ACF, capítulos, ordem de membros com versículos

---

## Fluxos Principais

1. **Marcar presença**: Histórico → toca reunião → chamada → toggle membros → Salvar
2. **Adicionar membro**: Membros → FAB (+) → preenche modal → Salvar
3. **Novo evento**: Eventos → "+ Adicionar" → preenche modal → Salvar (requer senha)
4. **Nova ata**: Atas → "+ Nova Ata" → preenche → Salvar (requer senha)
5. **Novo recitativo**: Versinhos → "+ Novo Recitativo" → livro/caps/membros → Salvar

---

## Autenticação

Senha em memória de sessão (`sessionStorage` → `SecureStore`). Senha: `HOUVEUMSILENCIONOCEU`.
Abas restritas: Histórico, Membros, Visitas, Atas, Versinhos.

---

## Layout Mobile (9:16, portrait)

- Header fixo com gradiente indigo (sticky)
- Stats cards (3 colunas): Total Membros, Reuniões, Média
- Tab bar horizontal com scroll (7 abas)
- Cards com border-radius 14px e sombra suave
- FAB (botão flutuante) na aba Membros
- Modais bottom-sheet (slide de baixo)
- Toast de feedback (bottom, 80px acima da tab bar)
