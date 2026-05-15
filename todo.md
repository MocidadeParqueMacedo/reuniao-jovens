# TODO — Reunião de Jovens

## Funcionalidades Principais

- [x] Tela de Eventos (calendário anual + lista de eventos)
- [x] Tela de Histórico com filtros completos
- [x] Tela de Aniversários
- [x] Tela de Membros com menu e submenus
- [x] Tela de Visitas (Para Comuns e Locais)
- [x] Tela de Atas
- [x] Tela de Versinhos (Recitativos)
- [x] Gráficos de presença (linha e barra)
- [x] Sub-filtros de continuação na tela de Presença
- [x] Função de Adicionar Visitante
- [x] Lançamento automático de próxima reunião
- [x] Notificações de 3 faltas consecutivas

## Implementações Finais

- [x] Corrigir aba Visitas com menu Comuns e Locais conforme código original
- [x] Implementar notificações de 3 faltas consecutivas (adicionar automaticamente em Visitas > Locais)
- [ ] Implementar sincronização em tempo real com backend PostgreSQL
- [ ] Implementar exportação de presença em PDF

## Nova Fase: Autenticação e Sincronização Online

### Fase 1: Backend e Sincronização
- [x] Ler documentação do backend (server/README.md)
- [x] Configurar PostgreSQL e Drizzle ORM
- [x] Criar tabelas de usuários e permissões
- [x] Implementar WebSockets para sincronização em tempo real
- [x] Sincronizar dados de membros, reuniões, presença, etc.

### Fase 2: Autenticação com Google
- [ ] Configurar OAuth com Google
- [ ] Implementar login com Google no app
- [ ] Cadastro automático do admin (elias.g.alameda@gmail.com)
- [ ] Implementar login com email/senha como alternativa

### Fase 3: Painel de Admin
- [ ] Criar tela de admin para aprovar/rejeitar cadastros
- [ ] Implementar 2 níveis de acesso: ADM e Auxiliar de Jovens
- [ ] Gerenciar permissões por nível
- [ ] Seu login (admin) via Google

### Fase 4: Modo Offline/Online
- [ ] Visualização: funciona offline (dados em cache)
- [ ] Adicionar/Cadastrar: força estar online
- [ ] Sincronização automática quando voltar online
- [ ] Indicador visual de status online/offline

### Fase 5: Exportação em PDF
- [ ] Gerar PDF com presença + gráfico
- [ ] Opção de compartilhar ou baixar

## Configuração do Admin

- **Email:** elias.g.alameda@gmail.com
- **Senha:** elias1610
- **Login:** Via Google (sem digitar senha)
- **Níveis de acesso:** ADM e Auxiliar de Jovens


### Fase 2: Autenticação com Google + Email/Senha (Backend)
- [x] Adicionar campo `status` na tabela `users` (pendente/aprovado)
- [x] Adicionar campo `role` na tabela `users` (admin/auxiliar)
- [x] Implementar endpoints tRPC para gerenciar usuários

### Fase 3: Autenticação com Email/Senha (Frontend)
- [x] Implementar login com email/senha
- [x] Implementar registro com email/senha
- [x] Criar tela de login no app
- [x] Configurar persistência com AsyncStorage
- [x] Testar fluxo completo de autenticação

### Fase 3: Painel de Admin
- [x] Criar tela de admin para aprovar/rejeitar usuários
- [x] Implementar aprovação de usuários com persistência
- [x] Implementar rejeição de usuários
- [x] Listar usuários pendentes de aprovação

### Fase 4: Sincronização Frontend-Backend
- [ ] Conectar app ao backend tRPC
- [ ] Sincronizar membros
- [ ] Sincronizar reuniões e presença
- [ ] Sincronizar visitas, atas, versinhos, eventos

### Fase 5: Modo Offline/Online
- [ ] Implementar verificação de conectividade
- [ ] Modo offline para visualização
- [ ] Modo online obrigatório para adicionar/editar
- [ ] Fila de sincronização

### Fase 6: Exportação em PDF
- [ ] Implementar geração de PDF com presença
- [ ] Implementar geração de PDF com gráfico


### Fase 4: Sincronização Frontend-Backend
- [ ] Criar hook para sincronizar membros com backend
- [ ] Criar hook para sincronizar reuniões e presença com backend
- [ ] Atualizar tela de Membros para usar dados do backend
- [ ] Atualizar tela de Histórico para usar dados do backend
- [ ] Implementar salvamento automático de dados no backend
