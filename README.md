# Buffa Finance

App Android para registrar as transações financeiras de um grupo de amigos, substituindo
a planilha de Excel. Cada pessoa cria sua própria conta e só enxerga as próprias
transações — ninguém vê o que os outros gastam.

## O que o app faz

- Login e cadastro simples (e-mail e senha).
- Registro de transações com valor, data, descrição, categoria, conta/cartão de origem
  e forma de pagamento (Pix, Cartão de Crédito, Cartão de Débito, Dinheiro, Boleto).
- Compras no cartão de crédito podem ser parceladas — o app divide o valor automaticamente
  entre os próximos meses.
- Aba de Transações (tela inicial) com lista agrupada por dia e o botão **+** para
  adicionar uma nova transação.
- Aba de Gráficos com despesas por categoria, receita x despesa por mês e saldo mensal.
- Aba de Perfil para cadastrar suas contas/cartões e sair da conta.
- Tudo em português, com valores em Real (R$).

## Stack

- [Expo](https://expo.dev) + React Native + TypeScript, com [Expo Router](https://docs.expo.dev/router/introduction/).
- [Supabase](https://supabase.com) (Postgres + Auth + Row Level Security) como backend —
  plano gratuito é suficiente para um grupo de amigos.

## 1. Criar o projeto no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e clique em **New Project**.
2. Escolha um nome (ex: `buffa-finance`), uma senha para o banco (guarde essa senha) e a
   região mais próxima de vocês.
3. Aguarde o projeto ser criado (leva cerca de 1-2 minutos).

## 2. Rodar as migrations (criar as tabelas)

As migrations estão em `supabase/migrations/`, na ordem em que devem ser executadas:

1. `20260704000001_initial_schema.sql` — cria as tabelas.
2. `20260704000002_rls_policies.sql` — garante a privacidade (cada um só vê os próprios dados).
3. `20260704000003_seed_categories.sql` — cria as categorias padrão (Mercado, Transporte, etc).
4. `20260704000004_create_purchase_rpc.sql` — cria a função que salva compras parceladas.

**Forma mais simples (recomendada):** no painel do Supabase, abra **SQL Editor**, cole o
conteúdo de cada arquivo (na ordem acima) e clique em **Run**. Repita para os 4 arquivos.

**Alternativa via CLI**, se preferir versionar as migrations com a CLI do Supabase:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

## 3. Configurar as variáveis de ambiente do app

1. No painel do Supabase, vá em **Project Settings > API**.
2. Copie a **Project URL** e a chave **anon public**.
3. Na raiz do projeto, copie `.env.example` para `.env`:

   ```bash
   cp .env.example .env
   ```

4. Preencha o `.env` com os valores copiados:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

A "anon key" é feita para ser pública (ela vai dentro do app) — quem protege os dados de
cada usuário são as políticas de Row Level Security criadas no passo 2.

## 4. Instalar dependências e rodar o app

```bash
npm install
npx expo start
```

- Para testar rapidamente no navegador (útil durante o desenvolvimento): `npm run web`.
- Para testar no seu celular Android sem gerar um APK: instale o app **Expo Go** na Play
  Store, rode `npx expo start --tunnel` e escaneie o QR code que aparece no terminal.
- Cada amigo pode criar sua própria conta na tela de cadastro do app.

## 5. Gerar o APK (para instalar sem a Play Store)

Se quiser um arquivo `.apk` de verdade para instalar direto no celular (em vez de usar o
Expo Go), o app usa o [EAS Build](https://docs.expo.dev/build/introduction/), o serviço de
build em nuvem da própria Expo — o plano gratuito é suficiente. Isso precisa rodar na sua
máquina (ou em qualquer ambiente com internet normal), não funciona de dentro de um sandbox
com rede restrita.

1. Instale a CLI da EAS (ou use `npx eas-cli` em cada comando, sem instalar):

   ```bash
   npm install -g eas-cli
   ```

2. Faça login com uma conta gratuita da Expo (cria uma em segundos se não tiver):

   ```bash
   eas login
   ```

3. Cadastre as variáveis de ambiente do Supabase (as mesmas do `.env`) direto no projeto da
   EAS, para que o build na nuvem tenha acesso a elas:

   ```bash
   eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://seu-projeto.supabase.co" --environment preview --visibility plaintext
   eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua-anon-key-aqui" --environment preview --visibility sensitive
   ```

4. Rode o build (perfil `preview`, já configurado em `eas.json` para gerar `.apk` em vez de
   `.aab`):

   ```bash
   eas build --platform android --profile preview
   ```

   Na primeira vez, a EAS vai perguntar se quer criar um projeto vinculado à sua conta —
   aceite (`Y`). O build roda na nuvem da Expo e leva alguns minutos. Ao final, aparece um
   link para baixar o `.apk` (a EAS também envia por e-mail).

5. Baixe o `.apk` no celular Android, abra o arquivo e permita "instalar apps de fontes
   desconhecidas" quando o Android perguntar (é esperado, já que o app não vem da Play
   Store). Mande o mesmo `.apk` para os seus amigos instalarem também.

## Estrutura do projeto

```
src/
├── app/                 # Telas (Expo Router: rotas por arquivo)
│   ├── (auth)/          # Login e cadastro
│   ├── (tabs)/          # Transações, Gráficos, Perfil
│   └── transacao/       # Nova transação e detalhe/exclusão
├── components/          # Componentes de UI reutilizáveis
├── hooks/               # Hooks de dados (Supabase + React Query) e autenticação
├── lib/supabase.ts      # Cliente do Supabase
├── types/               # Tipos TypeScript do banco de dados
├── utils/               # Formatação de moeda/data, parcelamento, agregações para gráficos
└── constants/           # Cores, categorias, formas de pagamento
supabase/migrations/     # SQL para criar o banco de dados
eas.json                 # Perfis de build do EAS (gera o .apk)
```

## Testes e verificação

```bash
npm run typecheck   # checagem de tipos TypeScript
npm test            # testes unitários (parcelamento e agregações dos gráficos)
npm run lint        # lint
```

Os testes em `__tests__/installments.test.ts` cobrem os casos mais delicados do
parcelamento: arredondamento (para a soma das parcelas sempre bater com o total) e
compras feitas no fim do mês (ex: dia 31) não "vazarem" para o mês errado.

## Limitações conhecidas (próximos passos possíveis)

- Não é possível editar uma transação depois de criada — apenas visualizar e excluir
  (excluir uma compra parcelada remove todas as parcelas de uma vez).
- As categorias são fixas (não é possível criar categorias personalizadas ainda).
- Hoje os dados são 100% privados por pessoa. O banco foi desenhado para permitir, no
  futuro, uma visão compartilhada entre o grupo de amigos, mas isso ainda não existe.
