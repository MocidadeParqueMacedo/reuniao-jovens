# 📱 Instruções de Setup - Múltiplos Celulares Conectados

## Problema Resolvido
O app agora suporta sincronização em tempo real entre múltiplos celulares! Implementamos:
- ✅ **HTTP Polling Fallback** - Se WebSocket falhar, sincroniza via HTTP a cada 5 segundos
- ✅ **Detecção Automática de LAN** - Se estiver na mesma rede WiFi, conecta automaticamente
- ✅ **Suporte a Túneis Públicos** - Use ngrok/Expo tunnel para acesso remoto

## Como Configurar

### Opção 1: Mesma Rede WiFi (Recomendado para Desenvolvimento)

1. **Descobrir o IP do seu PC:**
   ```bash
   # No seu PC/Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Procure por algo como: 192.168.x.x ou 10.x.x.x
   ```

2. **No seu PC, inicie o servidor:**
   ```bash
   cd /home/ubuntu/reuniao-jovens
   pnpm dev
   ```

3. **No celular, abra o Expo Go e escaneie o QR code**
   - O app detectará automaticamente o IP local e conectará

### Opção 2: Túnel Público (Para Acesso Remoto)

1. **Instale ngrok:**
   ```bash
   # Baixe em https://ngrok.com/download
   ```

2. **Crie um túnel para a porta 3000:**
   ```bash
   ngrok http 3000
   ```
   Você verá algo como: `https://abc123.ngrok.app`

3. **Configure a variável de ambiente:**
   ```bash
   export EXPO_PUBLIC_API_BASE_URL=https://abc123.ngrok.app
   ```

4. **Reinicie o app:**
   ```bash
   pnpm dev
   ```

5. **No celular, abra o Expo Go e escaneie o QR code**
   - O app conectará via túnel público

### Opção 3: Configuração Manual

Se nenhuma das opções acima funcionar, configure manualmente:

1. **Edite `.env.local` (crie se não existir):**
   ```
   EXPO_PUBLIC_API_BASE_URL=https://seu-servidor.com:3000
   ```

2. **Reinicie o app:**
   ```bash
   pnpm dev
   ```

## Testando a Conexão

### Teste 1: Verificar Conectividade
1. Abra o app no celular
2. Verifique o badge no canto superior direito
3. Deve mostrar **"Conectado"** (verde) ou **"Reconectando"** (amarelo)
4. Se mostrar **"Offline"** (vermelho), verifique os logs

### Teste 2: Sincronização em Tempo Real
1. Abra o app em 2 celulares diferentes
2. No celular 1, vá para "Membros" e adicione um novo membro
3. No celular 2, vá para "Membros"
4. O novo membro deve aparecer **instantaneamente** (ou em até 5 segundos se usando polling)

### Teste 3: Múltiplos Usuários
1. Faça login com usuários diferentes em cada celular
2. Teste adicionar eventos, marcar presença, etc
3. Verifique se as mudanças sincronizam entre todos os celulares

## Troubleshooting

### "Offline" no Badge
- Verifique se `EXPO_PUBLIC_API_BASE_URL` está configurado
- Teste se consegue acessar a URL no navegador do celular
- Verifique se o servidor está rodando: `pnpm dev`

### Conexão Lenta
- Se estiver usando HTTP Polling, é normal ter delay de até 5 segundos
- WebSocket é mais rápido, mas requer configuração de túnel

### Erro de DNS
- Verifique se o domínio/IP está correto
- Teste: `ping seu-servidor.com` no celular

## Arquitetura de Sincronização

```
┌─────────────────────────────────────────────────────────────┐
│                     Servidor (porta 3000)                   │
│                  - Express + WebSocket                      │
│                  - Banco de dados                           │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐ ┌────▼─────┐ ┌────▼─────┐
         │  Celular 1  │ │ Celular 2│ │ Celular 3│
         │  Expo Go    │ │ Expo Go  │ │ Expo Go  │
         │  WebSocket/ │ │WebSocket/│ │WebSocket/│
         │  HTTP Poll  │ │HTTP Poll │ │HTTP Poll │
         └─────────────┘ └──────────┘ └──────────┘
```

## Próximos Passos

1. **Implementar Compressão de Dados** - Reduzir tamanho das mensagens WebSocket
2. **Adicionar Autenticação de Conexão** - Validar que apenas usuários autorizados conectam
3. **Implementar Criptografia** - Proteger dados em trânsito com TLS/SSL

---

**Dúvidas?** Verifique os logs no console do Expo Go para mais detalhes.
