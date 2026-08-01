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
  adicionar uma nova transação. Tocando numa transação dá para vê-la, **editá-la** ou
  excluí-la.
- Ao digitar a descrição de uma transação, o app **sugere a categoria** automaticamente
  (ex: "iFood" → Alimentação, "Uber" → Transporte). É só uma sugestão: dá para trocar.
- No formulário de nova transação, um atalho **"Repetir todo mês"** cria a recorrência
  direto, sem precisar ir em Perfil > Recorrentes.
- Aba de Gráficos com despesas por categoria e receita x despesa por período (com seletor
  de mês inicial/final e os valores exibidos em cima das barras).
- Filtros por categoria, conta e forma de pagamento nas abas de Transações e Gráficos.
- Botão de **recarregar** na aba Transações (e puxar-pra-baixo no celular) para atualizar
  os dados.
- Aba de **Metas**: crie **limites de gasto** mensais (para todas as despesas ou só um
  escopo — categoria, conta ou forma de pagamento) e **caixinhas** para guardar dinheiro
  com depósitos e retiradas.
- **Tema** claro, escuro ou automático (segue o sistema), configurável em Perfil > Aparência.
- **Recorrentes** (Perfil > Recorrentes): salário e contas fixas (ex: internet) entram
  automaticamente todo mês. Ao alterar o valor de uma recorrência, os meses passados são
  preservados — só o mês atual e os seguintes mudam.
- **Exportar para Excel** (ícone de download na aba Transações): gera um `.xlsx` de um mês
  específico ou de um período, com uma aba de transações e uma aba de resumo.
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
5. `20260708000005_recurring_items.sql` — cria as recorrências (salário e contas fixas).
6. `20260710000006_update_purchase_fields.sql` — permite editar transações já registradas.
7. `20260725000007_goals.sql` — cria as metas (limites de gasto e caixinhas).

**Forma mais simples (recomendada):** no painel do Supabase, abra **SQL Editor**, cole o
conteúdo de cada arquivo (na ordem acima) e clique em **Run**. Repita para todos os arquivos.
Os arquivos são seguros para rodar de novo caso algo dê errado no meio do caminho — pode
colar e rodar de novo sem medo de erros de "já existe".

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

3. Rode o build (perfil `preview`, já configurado em `eas.json` para gerar `.apk` em vez de
   `.aab`):

   ```bash
   eas build --platform android --profile preview
   ```

   Na primeira vez, a EAS vai perguntar se quer criar um projeto vinculado à sua conta —
   aceite (`Y`). O build roda na nuvem da Expo e leva alguns minutos. Ao final, aparece um
   link para baixar o `.apk` (a EAS também envia por e-mail).

As variáveis do Supabase já estão no `eas.json` (bloco `env` de cada perfil), então o build
da nuvem as embute automaticamente — não precisa configurar mais nada. A EAS **não** envia o
arquivo `.env` local para o build (ele é ignorado pelo `.gitignore`); por isso as variáveis
ficam no `eas.json`. A "anon key" é feita para ser pública (vai dentro do app de qualquer
jeito), então tê-la aqui não é problema — a segurança dos dados vem das políticas de RLS.

5. Baixe o `.apk` no celular Android, abra o arquivo e permita "instalar apps de fontes
   desconhecidas" quando o Android perguntar (é esperado, já que o app não vem da Play
   Store). Mande o mesmo `.apk` para os seus amigos instalarem também.

## 6. Versão web (hospedar no Vercel)

O mesmo código roda no navegador — dá para publicar uma versão web (útil para quem prefere
usar no computador) de graça no [Vercel](https://vercel.com). O projeto já vem com o
`vercel.json` configurado (build com `npm run build:web`, saída em `dist/`, e o
redirecionamento de rotas para funcionar como single-page app).

Melhorias específicas da versão web:

- **Coluna central:** em telas largas o app fica numa coluna centralizada (como um celular),
  em vez de esticar na largura toda.
- **Instalável (PWA):** dá para instalar o site como app (menu do Chrome > "Instalar", ou no
  celular "Adicionar à tela inicial") e ele abre em tela cheia, sem a barra do navegador.
- **Atalho de teclado:** aperte **N** (fora de um campo de texto) para abrir "Nova Transação".
- **Enter** envia os formulários de login e cadastro.

Testar o build web localmente antes de publicar:

```bash
npm run build:web   # gera a pasta dist/ (export + injeção das tags de PWA)
npx serve dist      # abre um servidor local para conferir
```

Publicar no Vercel:

1. Crie uma conta gratuita em [vercel.com](https://vercel.com) e clique em **Add New… >
   Project**.
2. Importe este repositório do GitHub. O Vercel lê o `vercel.json` automaticamente — não
   precisa configurar comando de build nem pasta de saída na mão.
3. Como o `.env` está commitado no repositório, as variáveis do Supabase já entram no build.
   Se preferir removê-lo do repositório por segurança, cadastre as duas variáveis em
   **Settings > Environment Variables** no Vercel (com os mesmos nomes,
   `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
4. Clique em **Deploy**. Em um ou dois minutos o Vercel te dá uma URL pública (ex:
   `buffa-finance.vercel.app`) que você e seus amigos podem abrir em qualquer navegador.

> Importante: a URL do app precisa ser adicionada em **Authentication > URL Configuration >
> Redirect URLs** no painel do Supabase, para o link de confirmação de e-mail funcionar na
> versão web.

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
