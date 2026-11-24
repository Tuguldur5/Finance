# Санхүү — хувийн санхүүгийн удирдлага

Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase дээр
суурилсан хувийн санхүүгийн веб апп. UI бүхэлдээ монгол хэлээр, харанхуй загвар
үндсэн, гэрэл загвар сольж болно.

Онцлог:

- Хэтэвч, орлого/зарлага, шилжүүлэг, давтамжтай гүйлгээ
- Сар бүрийн төсөв, хуримтлалын зорилго, өр, зээлийн тооцоо
- Хяналтын самбар ба тайлан (6 сарын урсгал, ангиллын задаргаа, цэвэр хөрөнгө)
- Нэвтрэх шаардлагагүй 14 нийтийн тооцоолуур (`/calculators`)
- Ангиллын удирдлага, хэтэвчийн дараалал, JSON/CSV экспорт, бүртгэл устгах
- RLS бүх хүснэгтэд; хэрэглэгч бүр зөвхөн өөрийн мэдээллийг харна

## Setup

1. **Supabase project** — [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. **SQL migration** — run both files in order from `supabase/migrations/`
   (`20261119090000_initial_schema.sql`, then `20261120090000_google_auth.sql`)
   with `supabase db push`, or paste them into **SQL Editor** one at a time.
3. **Enable Google provider** — Supabase → **Authentication → Providers → Google** → enable.
4. **Google Cloud OAuth client** — [console.cloud.google.com](https://console.cloud.google.com)
   → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
   Authorized redirect URI:

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

   Copy the Client ID and Client secret into the Supabase Google provider, save,
   then add these redirect URLs in Supabase → **Authentication → URL Configuration**:
   `http://localhost:3000/auth/callback` and
   `https://<production-domain>/auth/callback`.
5. **Env + run** — `cp .env.example .env.local`, fill the three Supabase values,
   then `npm install && npm run dev`. Check `http://localhost:3000/api/health`.

## Шаардлага

- Node.js 20.18+ (Node 22+ зөвлөнө)
- Supabase бүртгэл (үнэгүй төлөвлөгөө хангалттай)
- Vercel бүртгэл (deploy хийх бол)

## 1. Supabase төсөл үүсгэх

1. [supabase.com/dashboard](https://supabase.com/dashboard) дээр **New project** дар.
2. Нэр, нууц үг, бүс (Mongolia-д ойрхон бүс сонго) оруулж үүсгэ.
3. **Project Settings → API** хэсгээс дараах утгуудыг хуулж ав:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (зөвхөн серверт)

## 2. Өгөгдлийн санг үүсгэх (migration)

Схем, RLS, триггер, анхны ангиллууд
`supabase/migrations/20261119090000_initial_schema.sql` файлд, Google auth-ын
`avatar_url` + шинэчлэгдсэн signup trigger нь
`supabase/migrations/20261120090000_google_auth.sql` файлд байна. Хоёрыг дараалан
ажиллуулна.

**Supabase CLI ашиглах (санал болгож буй):**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

**SQL Editor ашиглах:**

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. Эхлээд `20261119090000_initial_schema.sql`, дараа нь
   `20261120090000_google_auth.sql` файлын агуулгыг хуулж тавиад **Run** дар.

Migration нь:

- `profiles`, `wallets`, `categories`, `transactions`, `recurring_rules`,
  `budgets`, `savings_goals`, `goal_contributions`, `debts`, `debt_payments`,
  `loans`, `net_worth_snapshots` хүснэгтүүд
- бүх хүснэгтийн RLS бодлого
- шинэ хэрэглэгчид зориулсан trigger (профайл, үндсэн хэтэвч, 22 ангилал)
- `wallet_balances`, `debt_balances` view, `calculate_net_worth`,
  `capture_net_worth_snapshot` функцууд

## 3. Орчны хувьсагчид

```bash
cp .env.example .env.local
```

| Хувьсагч | Тайлбар |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (браузерт харагдана) |
| `SUPABASE_SERVICE_ROLE_KEY` | Зөвхөн сервер. Бүртгэл устгахад ашиглана |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (production-д домэйн) |

`SUPABASE_SERVICE_ROLE_KEY` байхгүй бол бусад бүх зүйл ажиллана, зөвхөн
**Бүртгэл устгах** үйлдэл алдаа өгнө.

## 4. Auth тохиргоо (Google-only)

И-мэйл/нууц үгийн нэвтрэлт бүрэн хасагдсан. `/register` нь `/login` руу
шилжинэ; нэвтрэх цорын ганц арга нь Google OAuth.

**Supabase → Authentication → Providers → Google**:

- Provider-ийг идэвхжүүл.
- Google Cloud OAuth client-ийн Client ID / Client secret оруул.
- Google Cloud дээр authorized redirect URI нь
  `https://<project-ref>.supabase.co/auth/v1/callback` байна.

**Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (production-д `https://<domain>`)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<production-domain>/auth/callback`

Диагностик: `GET /api/health` нь `{ env, db, auth, error? }` буцаана (key утга
хэзээ ч буцаахгүй).

## 5. Ажиллуулах

```bash
npm install
npm run dev
```

- `http://localhost:3000` — landing
- `http://localhost:3000/calculators` — нийтийн тооцоолуурууд
- `http://localhost:3000/login` — Google-р нэвтрэх
- `http://localhost:3000/api/health` — Supabase холболтын диагностик
- `http://localhost:3000/app` — нэвтэрсний дараах хяналтын самбар

## 6. Vercel дээр deploy

1. GitHub-д repo push хийнэ.
2. [vercel.com/new](https://vercel.com/new) дээр repo-г import хийнэ.
3. **Environment Variables** хэсэгт дээрх 4 хувьсагчийг нэмнэ
   (`NEXT_PUBLIC_SITE_URL` нь production домэйн, жишээ нь
   `https://sankhuu.vercel.app`).
4. Deploy дарна. Next.js автоматаар танигдана; build command `npm run build`.

Deploy-ийн дараа Supabase → Authentication → URL Configuration дээр production
домэйныг Site URL болгож, `/auth/callback`-ыг Redirect URLs-д нэмэхээ мартуузай.

## Скриптүүд

| Команд | Тайлбар |
| --- | --- |
| `npm run dev` | Хөгжүүлэлтийн сервер |
| `npm run build` | Production build |
| `npm start` | Production сервер |
| `npm run typecheck` | TypeScript шалгалт |
| `npm run lint` | ESLint |
| `npm test` | Vitest (санхүү + тооцоолуурын логик) |

## Бүтэц

```
app/                    Next.js App Router хуудсууд
  app/                  Нэвтэрсэн хэрэглэгчийн хэсэг (dashboard, transactions…)
  calculators/          Нийтийн тооцоолуурууд ([slug] dynamic route)
  actions/              Server actions (zod-оор шалгадаг)
components/ui/          shadcn/ui компонентууд
components/             Домэйн компонентууд (Money, settings, calculators…)
hooks/                  TanStack Query hooks
lib/config.ts           Валют, цагийн бүс, татварын/төсвийн тогтмолууд
lib/finance/            Цэвэр санхүүгийн функцууд + Vitest тестүүд
lib/calculators/        Нийтийн тооцоолуурын функцууд + тестүүд
lib/i18n/               Монгол хэлний толь (mn.ts) ба t() helper
lib/supabase/           Browser / server / admin / middleware клиентууд
lib/env.ts              Орчны хувьсагчийн zod шалгалт
instrumentation.ts      Сервер асах үед env шалгах hook
supabase/migrations/    Схем, RLS, trigger, view, функцууд
middleware.ts           Session refresh + /app хамгаалалт
```

## Дүрмүүд

- UI текст бүхэн `lib/i18n/mn.ts`-д, компонент дотор хатуу бичвэр байхгүй.
- Мөнгөн дүнг `numeric`-ээр хадгалж, харуулахдаа `<Money />` ашиглана.
- Сервер action бүр zod-оор оролтыг шалгана; RLS эцсийн хамгаалалт.
- Бизнесийн логик `lib/finance`, `lib/calculators` дотор цэвэр функцээр
  бичигдэж, Vitest тесттэй байна.
- Supabase-ийн зөвхөн anon key клиент талд; service role key зөвхөн серверт.

## Татвар ба ханшийн тэмдэглэл

- Цалингийн тооцоолуур `lib/config.ts` дахь `PAYROLL_CONFIG`-оос НДШ (11.5%),
  ХХОАТ (10%), сарын хөнгөлөлт (20,000₮)-ыг авна. Эдгээр нь лавлагааны утга —
  мөрдөгдөж буй хууль тогтоомжоор баталгаажуулна уу.
- Ханшийн хөрвүүлэгч гадаад API ашиглахгүй; ханшийг гараар оруулж, браузерын
  `localStorage`-д хадгална.
# Finnacce
