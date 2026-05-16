# 📱 Instruções de Setup - Múltiplos Celulares Conectados

## ✅ Problema Resolvido!

O app agora usa **HTTP Polling** para sincronização - muito mais confiável que WebSocket em redes móveis!

- ✅ **Sincroniza a cada 5 segundos** - Todos os dados sincronizam automaticamente
- ✅ **Funciona em qualquer rede** - WiFi, 4G, LAN, túneis públicos
- ✅ **Sem configuração complexa** - Apenas defina a URL do servidor

## Como Usar

### Passo 1: Descobrir a URL do Servidor

Você precisa de uma URL pública que o celular consiga acessar. Escolha uma opção:

#### Opção A: Túnel Público com ngrok (Recomendado)

```bash
# 1. Baixe ngrok em https://ngrok.com/download

# 2. Crie um túnel para a porta 3000
ngrok http 3000

# Você verá algo como:
# Forwarding    https://abc123.ngrok.app -> http://localhost:3000
```

Copie a URL: `https://abc123.ngrok.app`

#### Opção B: Usar um Servidor Remoto

Se você tem um servidor remoto (AWS, DigitalOcean, etc), use a URL dele:
`https://seu-servidor.com`

### Passo 2: Configurar o App

Defina a variável de ambiente **antes** de iniciar o app:

```bash
# Linux/Mac
export EXPO_PUBLIC_API_BASE_URL=https://abc123.ngrok.app
pnpm dev

# Windows (PowerShell)
$env:EXPO_PUBLIC_API_BASE_URL="https://abc123.ngrok.app"
pnpm dev

# Windows (CMD)
set EXPO_PUBLIC_API_BASE_URL=https://abc123.ngrok.app
pnpm dev
```

### Passo 3: Abrir no Celular

1. Abra o **Expo Go** no celular
2. Escaneie o **QR code** que aparece no terminal
3. O app deve carregar normalmente

### Passo 4: Testar Sincronização

1. Abra o app em **2 celulares diferentes**
2. No celular 1, vá para **"Membros"** e adicione um novo membro
3. No celular 2, vá para **"Membros"**
4. O novo membro deve aparecer em **até 5 segundos**

## Troubleshooting

### App não carrega
- Verifique se `EXPO_PUBLIC_API_BASE_URL` está definido
- Teste se consegue acessar a URL no navegador do celular
- Verifique se o servidor está rodando: `pnpm dev`

### Dados não sincronizam
- Aguarde até 5 segundos (tempo de polling)
- Verifique se a URL está correta
- Veja os logs no console do Expo Go

### Erro de Certificado SSL
- Se usar ngrok, o certificado é automático
- Se usar servidor remoto, garanta que tem HTTPS válido

## Arquitetura

```
┌─────────────────────────────────────┐
│   Servidor (porta 3000)             │
│   - Express + Banco de Dados        │
│   - Exposto via ngrok/túnel         │
└─────────────────────────────────────┘
            ▲
            │ HTTP Polling (a cada 5s)
            │
    ┌───────┼───────┐
    │       │       │
┌───▼──┐ ┌──▼───┐ ┌─▼────┐
│Cell 1│ │Cell 2│ │Cell 3│
│Expo  │ │Expo  │ │Expo  │
└──────┘ └──────┘ └──────┘
```

## Exemplo Completo

```bash
# Terminal 1: Iniciar ngrok
ngrok http 3000
# Output: Forwarding https://abc123.ngrok.app -> http://localhost:3000

# Terminal 2: Iniciar o app
export EXPO_PUBLIC_API_BASE_URL=https://abc123.ngrok.app
cd /home/ubuntu/reuniao-jovens
pnpm dev

# Celular: Escanear QR code e testar
```

## Próximos Passos

1. **Testar com múltiplos celulares** - Valide sincronização em tempo real
2. **Otimizar frequência de polling** - Ajuste de 5s para melhor performance
3. **Adicionar indicador de sincronização** - Mostrar quando está sincronizando

---

**Dúvidas?** Verifique os logs no console do Expo Go.
