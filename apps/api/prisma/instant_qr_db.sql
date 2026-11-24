--
-- PostgreSQL database dump
--

\restrict lIMFqzSysuqVpeQqaXFLthIxiXrkd90IADYhmlbi80KmT15sHS51jzkGH7PV9FA

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: qr_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO qr_admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: qr_admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: qr_admin
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO qr_admin;

--
-- Name: OrderType; Type: TYPE; Schema: public; Owner: qr_admin
--

CREATE TYPE public."OrderType" AS ENUM (
    'DINE_IN',
    'TAKEAWAY'
);


ALTER TYPE public."OrderType" OWNER TO qr_admin;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: qr_admin
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'STRIPE'
);


ALTER TYPE public."PaymentMethod" OWNER TO qr_admin;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: qr_admin
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO qr_admin;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: qr_admin
--

CREATE TYPE public."Role" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'STAFF'
);


ALTER TYPE public."Role" OWNER TO qr_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO qr_admin;

--
-- Name: branch_products; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.branch_products (
    id text NOT NULL,
    "branchId" text NOT NULL,
    "productId" text NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "priceOverride" numeric(10,2),
    "isEnabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.branch_products OWNER TO qr_admin;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.branches (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    address text,
    phone text,
    "countryCode" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    currency text DEFAULT 'INR'::text NOT NULL
);


ALTER TABLE public.branches OWNER TO qr_admin;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.categories (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text
);


ALTER TABLE public.categories OWNER TO qr_admin;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "productName" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    notes text
);


ALTER TABLE public.order_items OWNER TO qr_admin;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" integer NOT NULL,
    "restaurantId" text NOT NULL,
    "branchId" text NOT NULL,
    "tableNumber" text,
    "customerName" text NOT NULL,
    "customerPhone" text NOT NULL,
    "orderNotes" text,
    "orderType" public."OrderType" DEFAULT 'DINE_IN'::public."OrderType" NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod" DEFAULT 'CASH'::public."PaymentMethod" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    "cancelReason" text,
    "cancelledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO qr_admin;

--
-- Name: orders_orderNumber_seq; Type: SEQUENCE; Schema: public; Owner: qr_admin
--

CREATE SEQUENCE public."orders_orderNumber_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."orders_orderNumber_seq" OWNER TO qr_admin;

--
-- Name: orders_orderNumber_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: qr_admin
--

ALTER SEQUENCE public."orders_orderNumber_seq" OWNED BY public.orders."orderNumber";


--
-- Name: products; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.products (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    description text,
    "basePrice" numeric(10,2) NOT NULL,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text
);


ALTER TABLE public.products OWNER TO qr_admin;

--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.restaurants (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "logoUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "defaultCurrency" text DEFAULT 'INR'::text NOT NULL,
    "themeConfig" jsonb,
    "paymentConfig" jsonb
);


ALTER TABLE public.restaurants OWNER TO qr_admin;

--
-- Name: staff_members; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.staff_members (
    id text NOT NULL,
    "restaurantId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'CUSTOM'::text NOT NULL,
    "assignedBranches" jsonb DEFAULT '[]'::jsonb NOT NULL,
    permissions jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "pinCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.staff_members OWNER TO qr_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: qr_admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    role public."Role" DEFAULT 'ADMIN'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "countryCode" text,
    phone text,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "isPlatformAdmin" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO qr_admin;

--
-- Name: orders orderNumber; Type: DEFAULT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.orders ALTER COLUMN "orderNumber" SET DEFAULT nextval('public."orders_orderNumber_seq"'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
18ed627e-7ee6-4ec0-b345-c82f98352ab3	34f72cbe17e35cff7149ba68a9a3c543a157f14f8e05506014169109e84db542	2026-10-21 09:15:27.26612+00	20261021091527_init_restaurant	\N	\N	2026-10-21 09:15:27.174914+00	1
12081889-b66b-4982-98b1-5a18c02c0686	662acbc6cc098c02ad265dcb72af56da79726629f19d9822a7acac7fa8a11511	2026-10-22 05:17:21.728477+00	20261022051721_add_user_model	\N	\N	2026-10-22 05:17:21.703244+00	1
056f4d9b-310f-4b2f-a8c7-0ee313fbea05	8b74fac02aeb555bdf129cb4969329905ba4ea99947a669aaf0e2fdbe6c357b8	2026-10-22 09:56:25.278156+00	20261022095625_add_country_code_and_phone	\N	\N	2026-10-22 09:56:25.273652+00	1
4454eb72-f5cd-4334-86a6-255001713e57	e736f713a3c271890e1130bec1a765d1e30f02b9bb3954c66b0add3b7089a875	2026-10-27 09:09:27.204778+00	20261027090927_add_categories_and_products	\N	\N	2026-10-27 09:09:27.056154+00	1
\.


--
-- Data for Name: branch_products; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.branch_products (id, "branchId", "productId", "isAvailable", "priceOverride", "isEnabled") FROM stdin;
990e07a8-7c7e-48c3-9ce5-c61e67e17464	e143f84d-1a44-4fb6-bdf3-56c1125696ac	ca92a1ab-26ac-44f7-a3f1-0690a7d5b9ad	t	\N	t
38ab285b-9dc8-4227-a5d6-fb6b0dc60242	cce75ec3-1e9b-4e15-a179-d5b0b43a5808	6a15f672-5c46-48f0-84e8-1ca30ae609a5	t	120.00	t
336ed345-e646-4c30-9466-0dbf56ce29a1	638bab36-4376-40d2-9560-0d9afbdf9f11	6a15f672-5c46-48f0-84e8-1ca30ae609a5	t	\N	t
16ced2ab-49da-45b2-a96a-4f5b58d28048	de8718fe-8eed-4c2a-9731-719126c65a46	b0699d36-2967-42d9-b46c-86ee549f5915	t	\N	t
5693383e-7141-468f-ba34-9e942232ca8c	e143f84d-1a44-4fb6-bdf3-56c1125696ac	b0699d36-2967-42d9-b46c-86ee549f5915	t	\N	t
3c1b30ae-ba45-4a79-9e91-89f4395723e0	de8718fe-8eed-4c2a-9731-719126c65a46	41eb35a9-418b-4a7d-8283-50a2e9bb5679	t	\N	t
4e8a8a4d-dd33-4d0a-aa20-e2611449b4c7	e143f84d-1a44-4fb6-bdf3-56c1125696ac	41eb35a9-418b-4a7d-8283-50a2e9bb5679	t	\N	t
3b42a37b-c3ef-432a-8ffc-cc074dbc6a65	de8718fe-8eed-4c2a-9731-719126c65a46	9e37bb27-3769-46c7-a5bc-5b5fe41f70e0	t	\N	t
122f84fa-5ed3-4272-9ad2-34731c515d91	e143f84d-1a44-4fb6-bdf3-56c1125696ac	9e37bb27-3769-46c7-a5bc-5b5fe41f70e0	t	\N	t
f35691f1-5650-42c3-9a9d-647e78882fa6	de8718fe-8eed-4c2a-9731-719126c65a46	f46892a1-0c84-4249-8c04-a239ce23128a	t	\N	t
f6009efb-12cc-4840-8ad8-e842f070c275	e143f84d-1a44-4fb6-bdf3-56c1125696ac	f46892a1-0c84-4249-8c04-a239ce23128a	t	\N	t
e3cf17a8-a9b2-40bf-b52a-7b8f82397da4	de8718fe-8eed-4c2a-9731-719126c65a46	878ae9fb-a74f-4fea-971f-c07b4f3de7a7	t	\N	t
1fa1df3c-5389-4817-a6ad-add6f53b44de	e143f84d-1a44-4fb6-bdf3-56c1125696ac	878ae9fb-a74f-4fea-971f-c07b4f3de7a7	t	\N	t
3318a21e-b74a-4f3f-8d9c-7a0fef1c515c	de8718fe-8eed-4c2a-9731-719126c65a46	80368e9c-cb18-45eb-97c0-425ee0d053d5	t	\N	t
8e281940-2874-4bb8-ad07-6dea8d670e8b	e143f84d-1a44-4fb6-bdf3-56c1125696ac	80368e9c-cb18-45eb-97c0-425ee0d053d5	t	\N	t
f6e95444-241f-4313-8c67-a9695d0f9da3	de8718fe-8eed-4c2a-9731-719126c65a46	c8afc9c4-0a22-4d93-9e8e-f4a776c02496	t	\N	t
c0d82324-3300-4ec8-9b7e-c845823dfdde	e143f84d-1a44-4fb6-bdf3-56c1125696ac	c8afc9c4-0a22-4d93-9e8e-f4a776c02496	t	250.00	t
80d64c6c-f8e5-40f0-a1aa-fc8dfab9b846	de8718fe-8eed-4c2a-9731-719126c65a46	86470c06-8469-4aef-926f-e3544432fbc8	t	\N	t
4973d07d-1948-4bf8-bcfd-def3a5255ff6	e143f84d-1a44-4fb6-bdf3-56c1125696ac	86470c06-8469-4aef-926f-e3544432fbc8	t	\N	t
fe139a56-eeda-4a09-8b54-fc92430474a1	de8718fe-8eed-4c2a-9731-719126c65a46	bca19ba9-9020-417c-9564-4c6424d76e2a	t	\N	t
c38de168-2018-4da9-a56c-43c4605db766	e143f84d-1a44-4fb6-bdf3-56c1125696ac	bca19ba9-9020-417c-9564-4c6424d76e2a	t	\N	t
1c3b3a56-638e-4208-ae95-c22f5a5336ce	de8718fe-8eed-4c2a-9731-719126c65a46	bdc15e9e-9651-46b1-b212-d458ef736ab4	t	\N	t
00ab7582-f3e2-451d-bb2c-a9f9ad9d6ec6	e143f84d-1a44-4fb6-bdf3-56c1125696ac	bdc15e9e-9651-46b1-b212-d458ef736ab4	t	\N	t
c989a211-d6f5-4eca-b447-7231a0349ee0	de8718fe-8eed-4c2a-9731-719126c65a46	2b850d11-b9a1-4410-a361-e8a4822d885a	t	\N	t
d7b8a53d-79ea-4be0-af93-2af5f2954108	e143f84d-1a44-4fb6-bdf3-56c1125696ac	2b850d11-b9a1-4410-a361-e8a4822d885a	t	\N	t
78b961d0-e4d7-46e4-9e9f-a05ef4a6dbab	de8718fe-8eed-4c2a-9731-719126c65a46	2a1f61e7-02fc-448d-8aea-14cf0d37622c	t	\N	t
af122254-ea6a-4f5b-8cd8-db019744ad8f	e143f84d-1a44-4fb6-bdf3-56c1125696ac	2a1f61e7-02fc-448d-8aea-14cf0d37622c	t	\N	t
e4ffdc19-a07a-421e-b00a-3347038f233a	de8718fe-8eed-4c2a-9731-719126c65a46	14f83dd4-6cc2-4398-8309-8d3af7b3aea9	t	\N	t
70bcd236-3764-42cf-af15-0aa05bb7a658	e143f84d-1a44-4fb6-bdf3-56c1125696ac	14f83dd4-6cc2-4398-8309-8d3af7b3aea9	t	\N	t
d930446c-a5ee-4d5b-bbd8-794cc3176cd6	de8718fe-8eed-4c2a-9731-719126c65a46	cd54daab-fc70-4bfd-b3e6-da47b1b21803	t	\N	t
46cb2221-678b-495a-b1c1-b27dec35e187	e143f84d-1a44-4fb6-bdf3-56c1125696ac	cd54daab-fc70-4bfd-b3e6-da47b1b21803	t	\N	t
96ef52e1-5ca1-4b2f-87f5-244b1f2611ea	de8718fe-8eed-4c2a-9731-719126c65a46	334c09bc-05a1-4125-9dfd-a65c51b23949	t	\N	t
82e5b8d6-9a0a-4d14-a811-4ea6f25d7b5e	e143f84d-1a44-4fb6-bdf3-56c1125696ac	334c09bc-05a1-4125-9dfd-a65c51b23949	t	\N	t
ed271213-a59d-4a25-809d-0d2ed213618d	de8718fe-8eed-4c2a-9731-719126c65a46	e0179bc7-0c3f-4215-9776-45324ce91ee5	t	\N	t
8de341bd-4877-4587-93cc-f54248985aba	e143f84d-1a44-4fb6-bdf3-56c1125696ac	e0179bc7-0c3f-4215-9776-45324ce91ee5	t	\N	t
8d6c2842-ab57-4a27-be4f-0907c80248e8	de8718fe-8eed-4c2a-9731-719126c65a46	e8a0b2aa-645a-4423-b675-b23a61227297	t	\N	t
755b2ee8-b44d-4887-ab66-3cc0ba45be43	e143f84d-1a44-4fb6-bdf3-56c1125696ac	e8a0b2aa-645a-4423-b675-b23a61227297	t	\N	t
567547a1-f062-4308-a3e4-e7d8ef69063e	de8718fe-8eed-4c2a-9731-719126c65a46	8f700e21-6b46-4a52-a8ed-72f1fb49388d	t	\N	t
01458368-3814-4df9-9463-b49a3f3e4993	e143f84d-1a44-4fb6-bdf3-56c1125696ac	8f700e21-6b46-4a52-a8ed-72f1fb49388d	t	\N	t
f41ef7d3-128e-4cd5-af72-e2a90310c324	de8718fe-8eed-4c2a-9731-719126c65a46	fba6f1cc-7026-4285-9088-e09b40e3a028	t	\N	t
cff678b7-a296-4500-8a11-1e10bb2c3d30	e143f84d-1a44-4fb6-bdf3-56c1125696ac	fba6f1cc-7026-4285-9088-e09b40e3a028	t	\N	t
ba5e495e-ed47-4459-a626-d9a1f701a18d	de8718fe-8eed-4c2a-9731-719126c65a46	60a78c4a-9f03-4545-8e2c-ac4408bed34b	t	\N	t
ad7d0439-5466-4c67-a91f-e648b52fe37a	e143f84d-1a44-4fb6-bdf3-56c1125696ac	60a78c4a-9f03-4545-8e2c-ac4408bed34b	t	\N	t
d8ba7642-18da-4c0c-a299-d846487155b8	de8718fe-8eed-4c2a-9731-719126c65a46	a914607f-964e-4c1d-b396-63a2f329abb1	t	\N	t
709fe764-2cea-4b70-8a72-ca4354872c61	e143f84d-1a44-4fb6-bdf3-56c1125696ac	a914607f-964e-4c1d-b396-63a2f329abb1	t	\N	t
cd0f256e-b5e4-44a1-9635-c5ede19f71d0	de8718fe-8eed-4c2a-9731-719126c65a46	b24d4437-966f-4dc6-924e-a0fc8ec7b19c	t	\N	t
107fa687-745e-4e93-bb3a-3443005c44f0	e143f84d-1a44-4fb6-bdf3-56c1125696ac	b24d4437-966f-4dc6-924e-a0fc8ec7b19c	t	\N	t
373bd8de-1f02-42b5-8e0e-a46bda5526e6	de8718fe-8eed-4c2a-9731-719126c65a46	5b9d78e7-244d-4436-b62b-01e574b3140d	t	\N	t
0c2a5606-97ea-48f9-90db-f0e39ab34cda	e143f84d-1a44-4fb6-bdf3-56c1125696ac	5b9d78e7-244d-4436-b62b-01e574b3140d	t	\N	t
9279b27c-34dd-4a49-8bf6-1224cff3e76d	de8718fe-8eed-4c2a-9731-719126c65a46	196caa42-2c5b-46e4-a84b-27e49089606b	t	\N	t
09fe7bd6-4b7e-4e57-82c2-b7c74766b2f0	e143f84d-1a44-4fb6-bdf3-56c1125696ac	196caa42-2c5b-46e4-a84b-27e49089606b	t	\N	t
39901d41-1556-4c1f-987a-4a24b7e1b2e8	de8718fe-8eed-4c2a-9731-719126c65a46	0186fca2-0eb9-44f1-8809-678ab6ba148d	t	\N	t
a700802e-9ee6-4cc0-a050-ea8c22f0f93c	e143f84d-1a44-4fb6-bdf3-56c1125696ac	0186fca2-0eb9-44f1-8809-678ab6ba148d	t	\N	t
436014af-0ce6-4ca6-a0e9-c13bf799b211	de8718fe-8eed-4c2a-9731-719126c65a46	2640ef66-b105-40a2-aa73-2b9efd37328f	t	\N	t
681ce24f-e2a4-4034-bad8-23a491546eed	e143f84d-1a44-4fb6-bdf3-56c1125696ac	2640ef66-b105-40a2-aa73-2b9efd37328f	t	\N	t
4a07e07a-002c-495c-8156-b0d73d487742	de8718fe-8eed-4c2a-9731-719126c65a46	4780d9b3-23d7-4fda-88c0-03a9e4179ded	t	\N	t
f7da1e2a-19ae-43ed-be4c-cd60e1e65212	e143f84d-1a44-4fb6-bdf3-56c1125696ac	4780d9b3-23d7-4fda-88c0-03a9e4179ded	t	\N	t
0bd7c548-051b-4bdb-9a34-63f7bf9f8740	de8718fe-8eed-4c2a-9731-719126c65a46	85ccc978-df08-46c7-8e30-5da8c8f57dbf	t	\N	t
661cd581-fd22-478f-884e-8d7d4fec215d	e143f84d-1a44-4fb6-bdf3-56c1125696ac	85ccc978-df08-46c7-8e30-5da8c8f57dbf	t	\N	t
a7f59485-b93b-4a8d-9eb0-aa647c270a82	de8718fe-8eed-4c2a-9731-719126c65a46	d24f214d-54b4-4602-9a69-e35e4b2f3106	t	\N	t
932a2a4e-3a80-4882-9d5d-869d46ace561	e143f84d-1a44-4fb6-bdf3-56c1125696ac	d24f214d-54b4-4602-9a69-e35e4b2f3106	t	\N	t
c2507cba-5875-4f19-8d1a-f9567c41ed63	de8718fe-8eed-4c2a-9731-719126c65a46	4f2440b7-b5aa-476d-8149-22f73c5d30c6	t	\N	t
ddee40db-5ecc-4cee-a138-c0baecd79006	e143f84d-1a44-4fb6-bdf3-56c1125696ac	4f2440b7-b5aa-476d-8149-22f73c5d30c6	t	\N	t
ea63821c-25be-4ba5-8ce1-a55838430f66	de8718fe-8eed-4c2a-9731-719126c65a46	d4b16dee-5993-49ae-b5e2-cf3f7323e586	t	\N	t
14a007c0-d2a3-43fe-8bdf-f63d699339fe	e143f84d-1a44-4fb6-bdf3-56c1125696ac	d4b16dee-5993-49ae-b5e2-cf3f7323e586	t	\N	t
66c5c882-a87d-4ded-ac73-6898a15fec2d	de8718fe-8eed-4c2a-9731-719126c65a46	043b301a-61c5-4095-af9a-4f20f3bf67b1	t	\N	t
8a580379-a580-44c6-92ef-a38d448904e1	e143f84d-1a44-4fb6-bdf3-56c1125696ac	043b301a-61c5-4095-af9a-4f20f3bf67b1	t	\N	t
1dc82011-10bc-4871-90ba-bd5a559fec53	de8718fe-8eed-4c2a-9731-719126c65a46	6936a866-1999-49c3-beb5-eb0f92121769	t	\N	t
c1c46f11-203f-435d-9be9-6a104b43a235	e143f84d-1a44-4fb6-bdf3-56c1125696ac	6936a866-1999-49c3-beb5-eb0f92121769	t	\N	t
61aeabb8-b2ac-44b5-96db-ed900e7a21c8	de8718fe-8eed-4c2a-9731-719126c65a46	912ee97c-0d6a-4954-ba3d-a4eff9897119	t	\N	t
ab172579-9fa5-4e65-8430-d89a27d55a2c	e143f84d-1a44-4fb6-bdf3-56c1125696ac	912ee97c-0d6a-4954-ba3d-a4eff9897119	t	\N	t
29ad1086-6e1b-4300-8f3a-30a0f2f981b6	de8718fe-8eed-4c2a-9731-719126c65a46	6b5c41b3-673e-4353-ba80-10c106f1a1f7	t	\N	t
a6f9d180-3905-4d7e-b437-f4f973f1c80c	e143f84d-1a44-4fb6-bdf3-56c1125696ac	6b5c41b3-673e-4353-ba80-10c106f1a1f7	t	\N	t
69133a45-84e2-49c1-a24d-91b782337520	de8718fe-8eed-4c2a-9731-719126c65a46	9470580d-5519-455f-914d-8e4e740ce529	t	\N	t
e665a292-3d31-4dbd-a026-98a0dda23f17	e143f84d-1a44-4fb6-bdf3-56c1125696ac	9470580d-5519-455f-914d-8e4e740ce529	t	\N	t
fe9d09fe-dad7-4c57-b6f3-8834e9c2fbe9	de8718fe-8eed-4c2a-9731-719126c65a46	1d015b19-410d-43f3-bc46-5c1537d0742c	t	\N	t
d6b06b8c-fbe3-4bb5-aea1-0407b5d22f01	e143f84d-1a44-4fb6-bdf3-56c1125696ac	1d015b19-410d-43f3-bc46-5c1537d0742c	t	\N	t
7cd79115-580a-4ec0-a7a9-5ec098bb97d5	de8718fe-8eed-4c2a-9731-719126c65a46	0c1e01dc-a7fe-4a58-853b-76b3b9285b44	t	\N	t
e87d659a-ad8c-487c-9457-ff902a0c505e	e143f84d-1a44-4fb6-bdf3-56c1125696ac	0c1e01dc-a7fe-4a58-853b-76b3b9285b44	t	\N	t
59fe367c-27fb-4edf-86df-52ba348fddcb	de8718fe-8eed-4c2a-9731-719126c65a46	71ec03b6-9c23-4a24-b7a8-223baa103d1d	t	\N	t
07da9ca9-c011-409b-82fe-19966af714c0	e143f84d-1a44-4fb6-bdf3-56c1125696ac	71ec03b6-9c23-4a24-b7a8-223baa103d1d	t	\N	t
9676ab48-5c4f-4327-8f2d-9f69f015677b	de8718fe-8eed-4c2a-9731-719126c65a46	e300ec77-4ed2-4f9b-8964-4669d20b0ca7	t	\N	t
39e54011-dd80-4c78-96fe-bc3688425bc5	e143f84d-1a44-4fb6-bdf3-56c1125696ac	e300ec77-4ed2-4f9b-8964-4669d20b0ca7	t	\N	t
d72adb89-7579-4a8d-b21f-3c54f3bc13a5	de8718fe-8eed-4c2a-9731-719126c65a46	e4da9777-a1ca-4bb2-927e-128dc2a3caa1	t	\N	t
1d8050e2-97fd-4578-84de-f2c4db19afb5	e143f84d-1a44-4fb6-bdf3-56c1125696ac	e4da9777-a1ca-4bb2-927e-128dc2a3caa1	t	\N	t
767157d0-8add-4772-bf51-da0e555a6fb8	de8718fe-8eed-4c2a-9731-719126c65a46	46cb2c24-97af-47e3-b86c-e825f5eeb766	t	\N	t
d2fa648a-c6e1-445e-9302-ad566c42e250	e143f84d-1a44-4fb6-bdf3-56c1125696ac	46cb2c24-97af-47e3-b86c-e825f5eeb766	t	\N	t
0b3f0370-ba8c-416e-a3c3-1ad5af289cdf	de8718fe-8eed-4c2a-9731-719126c65a46	2906d765-1138-4c76-885e-77b2b29c382a	t	\N	t
1d418bc3-0b49-4033-adc8-3fe4851ff7d6	e143f84d-1a44-4fb6-bdf3-56c1125696ac	2906d765-1138-4c76-885e-77b2b29c382a	t	\N	t
da3945be-af04-4ed0-b8ff-497b6e34d329	de8718fe-8eed-4c2a-9731-719126c65a46	12f16a86-c59f-4bf8-9f38-96d6cd5136d1	t	\N	t
d27e8fde-b035-405f-bc86-5609c53de4ee	e143f84d-1a44-4fb6-bdf3-56c1125696ac	12f16a86-c59f-4bf8-9f38-96d6cd5136d1	t	\N	t
92bacca7-c6d1-4c57-9df0-cb03d7b2cd27	de8718fe-8eed-4c2a-9731-719126c65a46	c1fa132a-898d-4c53-bbf0-835a80de1958	t	\N	t
fb75e68c-dfd9-4c56-b769-cc4a6cf68e4d	e143f84d-1a44-4fb6-bdf3-56c1125696ac	c1fa132a-898d-4c53-bbf0-835a80de1958	t	\N	t
6f56ff13-1c97-417d-ad91-3bb65cf8cede	de8718fe-8eed-4c2a-9731-719126c65a46	4d9a5264-0a40-438b-ba5e-5d64a28a6bed	t	\N	t
7089dad5-22cd-41d8-a078-1146552cef88	e143f84d-1a44-4fb6-bdf3-56c1125696ac	4d9a5264-0a40-438b-ba5e-5d64a28a6bed	t	\N	t
7853786a-d9d1-40f3-8440-6877981e1b5d	de8718fe-8eed-4c2a-9731-719126c65a46	72128d74-865a-4935-bfc1-275a7f6e8f5b	t	\N	t
70e54092-1711-4048-97f5-11552a62a845	e143f84d-1a44-4fb6-bdf3-56c1125696ac	72128d74-865a-4935-bfc1-275a7f6e8f5b	t	\N	t
a39fa12c-9dfb-4649-9765-c9eb7e503b9b	de8718fe-8eed-4c2a-9731-719126c65a46	84688a0f-e586-4b4c-a1ad-6bb5ba1c8add	t	\N	t
a24c2f40-db7c-423d-8ee4-7959c7c72986	e143f84d-1a44-4fb6-bdf3-56c1125696ac	84688a0f-e586-4b4c-a1ad-6bb5ba1c8add	t	\N	t
6c30fbce-ea95-4682-b7c7-2880ff57fe37	de8718fe-8eed-4c2a-9731-719126c65a46	468f1247-44de-4b61-b9f6-2978ae91fe28	t	\N	t
7c21bec8-9528-40f2-bfe9-fa4c142ba2d0	e143f84d-1a44-4fb6-bdf3-56c1125696ac	468f1247-44de-4b61-b9f6-2978ae91fe28	t	\N	t
bcc2148f-d27a-4396-87c4-d881e329f5da	de8718fe-8eed-4c2a-9731-719126c65a46	3dbee714-f008-46e8-8de3-1fcce0a3ee17	t	\N	t
4cc0cd68-bffb-40af-833d-499b0890d452	e143f84d-1a44-4fb6-bdf3-56c1125696ac	3dbee714-f008-46e8-8de3-1fcce0a3ee17	t	\N	t
1c05980d-28d8-4d0e-9411-2dc54c44fdfa	de8718fe-8eed-4c2a-9731-719126c65a46	95090903-0552-4e7b-8c92-3748b7189e0a	t	\N	t
f26b6c9d-cab8-4f5c-9d48-3f101e020bba	e143f84d-1a44-4fb6-bdf3-56c1125696ac	95090903-0552-4e7b-8c92-3748b7189e0a	t	\N	t
53a45302-dbee-45c4-8625-edef593881dc	de8718fe-8eed-4c2a-9731-719126c65a46	5bdc7d40-18b1-4ca7-8bc4-44ba491c39c2	t	\N	t
ffba0986-c4e0-481c-b327-968dc397d5a5	e143f84d-1a44-4fb6-bdf3-56c1125696ac	5bdc7d40-18b1-4ca7-8bc4-44ba491c39c2	t	\N	t
e9b21272-2636-4d3b-a3b7-878a24313312	de8718fe-8eed-4c2a-9731-719126c65a46	6d87e097-9f09-43c8-a881-c3c50541f97d	t	\N	t
63079fdf-f805-4d75-9d0d-5ba33dea1a09	e143f84d-1a44-4fb6-bdf3-56c1125696ac	6d87e097-9f09-43c8-a881-c3c50541f97d	t	\N	t
65218ea0-7bf7-4c6f-8f24-87d0a9a2cfd2	de8718fe-8eed-4c2a-9731-719126c65a46	869fcf50-b938-4b83-a029-45d0d0fb423f	t	\N	t
62e344e5-fa11-4da2-8e6b-345f2a85ad3e	e143f84d-1a44-4fb6-bdf3-56c1125696ac	869fcf50-b938-4b83-a029-45d0d0fb423f	t	\N	t
4d4cc824-5289-4dbd-af17-bc3db4d73894	de8718fe-8eed-4c2a-9731-719126c65a46	25d01cf4-eee4-4b15-a247-3b356edea9a6	t	\N	t
1aaba26d-e87b-4ca3-8124-f1df0bf2c05c	e143f84d-1a44-4fb6-bdf3-56c1125696ac	25d01cf4-eee4-4b15-a247-3b356edea9a6	t	\N	t
01e0667f-ec5b-47a5-8280-3414ed269711	de8718fe-8eed-4c2a-9731-719126c65a46	a767bd96-bb65-44a0-b738-f73fc6718985	t	\N	t
87deef79-5abd-41d3-a78e-8b9e3861e0da	e143f84d-1a44-4fb6-bdf3-56c1125696ac	a767bd96-bb65-44a0-b738-f73fc6718985	t	\N	t
4275c652-6153-4451-81c7-196c475c71cf	de8718fe-8eed-4c2a-9731-719126c65a46	09294bda-5d4a-4990-ac57-b84d11d53ad1	t	\N	t
8a5d873d-2e47-49a4-a526-6c9d4c1be34c	e143f84d-1a44-4fb6-bdf3-56c1125696ac	09294bda-5d4a-4990-ac57-b84d11d53ad1	t	\N	t
f204596f-bdd0-4b32-b277-0a58210ffbc0	de8718fe-8eed-4c2a-9731-719126c65a46	e26e2caa-6667-4794-9fac-950de2b16a76	t	\N	t
7cde8db0-f5a2-4a93-b0fd-6e15ba1e7a41	e143f84d-1a44-4fb6-bdf3-56c1125696ac	e26e2caa-6667-4794-9fac-950de2b16a76	t	\N	t
576cd4ca-4d23-472e-bd98-daab07c63d8a	de8718fe-8eed-4c2a-9731-719126c65a46	74a672ba-6289-42d5-911d-dc546f43b3ed	t	\N	t
83928a6c-d843-4ac1-9fdc-9882f31ad543	e143f84d-1a44-4fb6-bdf3-56c1125696ac	74a672ba-6289-42d5-911d-dc546f43b3ed	t	\N	t
8e2484e6-81ea-48d6-a423-3aff5798c416	de8718fe-8eed-4c2a-9731-719126c65a46	73ad2b46-d61f-4bb1-9889-4179d21c96e9	t	\N	t
7030502c-4880-4526-b120-c6b622bed064	e143f84d-1a44-4fb6-bdf3-56c1125696ac	73ad2b46-d61f-4bb1-9889-4179d21c96e9	t	\N	t
782c2efd-8cca-407b-b873-db837ff4bc84	de8718fe-8eed-4c2a-9731-719126c65a46	01315247-057f-4b57-8a7b-fae54e135196	t	\N	t
bc50a30b-22de-42e7-b6be-03d442ff240d	e143f84d-1a44-4fb6-bdf3-56c1125696ac	01315247-057f-4b57-8a7b-fae54e135196	t	\N	t
7a079ed1-fb36-497e-aeb8-d478186be0e3	de8718fe-8eed-4c2a-9731-719126c65a46	78134583-a0e9-4043-91cd-9a4b1e90e5c0	t	\N	t
dc85b9c0-d4a2-4d09-b595-d8105e53dec7	e143f84d-1a44-4fb6-bdf3-56c1125696ac	78134583-a0e9-4043-91cd-9a4b1e90e5c0	t	\N	t
fefb4576-7e38-4203-a90c-6f4b05d3dd85	de8718fe-8eed-4c2a-9731-719126c65a46	b39e6b7f-320a-4833-8b2c-decf82428aac	t	\N	t
44aa4780-443c-4f2a-bd33-809548ef787f	e143f84d-1a44-4fb6-bdf3-56c1125696ac	b39e6b7f-320a-4833-8b2c-decf82428aac	t	\N	t
8a2b3c43-e130-4f95-ab76-f34b1d02378b	de8718fe-8eed-4c2a-9731-719126c65a46	83a99826-8a1f-4bb6-abb5-27a17465ae5b	t	\N	t
2be29b7e-5909-44ac-baee-44a1dd95ebef	e143f84d-1a44-4fb6-bdf3-56c1125696ac	83a99826-8a1f-4bb6-abb5-27a17465ae5b	t	\N	t
275c3f5e-0f0a-46ae-8c52-3710d622c989	de8718fe-8eed-4c2a-9731-719126c65a46	d35feaf3-6d0a-48f3-bcf4-3d2d1605688e	t	\N	t
b456001d-58e7-4d99-9550-d6e437ded236	e143f84d-1a44-4fb6-bdf3-56c1125696ac	d35feaf3-6d0a-48f3-bcf4-3d2d1605688e	t	\N	t
fbb32371-8e3d-4e1e-8d96-4059af79dac0	de8718fe-8eed-4c2a-9731-719126c65a46	c909aac4-ace2-49e1-ac72-5579792fdbed	t	\N	t
5ba7e26d-1f8d-459f-93cc-27b7a30c7a5d	e143f84d-1a44-4fb6-bdf3-56c1125696ac	c909aac4-ace2-49e1-ac72-5579792fdbed	t	\N	t
f508d7a5-35f3-44ec-96a9-55b3a212ba97	de8718fe-8eed-4c2a-9731-719126c65a46	6a5b7629-b685-4d14-90cf-8157a06f1b50	t	\N	t
f7f0f635-6067-4f83-be9b-53bdcab2fd34	e143f84d-1a44-4fb6-bdf3-56c1125696ac	6a5b7629-b685-4d14-90cf-8157a06f1b50	t	\N	t
2ba3e3cc-d2d0-4455-8a3f-10156e9f56f5	de8718fe-8eed-4c2a-9731-719126c65a46	34471e01-e9f9-42e7-ac71-0dadde477753	t	\N	t
28fca692-d402-4439-9b0e-d3a88b1a71a5	e143f84d-1a44-4fb6-bdf3-56c1125696ac	34471e01-e9f9-42e7-ac71-0dadde477753	t	\N	t
5701d327-7a0d-40bf-a22c-2ddda4c9c279	de8718fe-8eed-4c2a-9731-719126c65a46	674bd64e-afc9-4fa4-b5ec-d8ca36d0e34f	t	\N	t
d4271d02-25a8-4422-8294-2f9d4d1c3148	e143f84d-1a44-4fb6-bdf3-56c1125696ac	674bd64e-afc9-4fa4-b5ec-d8ca36d0e34f	t	\N	t
c002f43d-66ec-44fa-a0b8-00a0192a1e02	de8718fe-8eed-4c2a-9731-719126c65a46	11fed668-0b2c-4bbe-b012-31648f01271c	t	\N	t
a838c1c4-c32a-492b-a0bf-d17b4d71202e	e143f84d-1a44-4fb6-bdf3-56c1125696ac	11fed668-0b2c-4bbe-b012-31648f01271c	t	\N	t
3755ba90-9139-4d3d-b2fd-a42d82101601	de8718fe-8eed-4c2a-9731-719126c65a46	e197490e-523e-48cd-b896-41d92028e3a7	t	\N	t
aaac54db-db1c-4c90-9932-992821939252	e143f84d-1a44-4fb6-bdf3-56c1125696ac	e197490e-523e-48cd-b896-41d92028e3a7	t	\N	t
7d3775d7-db02-4c23-af54-a89f3e19e9d9	de8718fe-8eed-4c2a-9731-719126c65a46	05739c0e-9302-414b-b0e8-640d1b41ebcd	t	\N	t
25526eab-b45b-49ad-a118-b4a6563948b0	e143f84d-1a44-4fb6-bdf3-56c1125696ac	05739c0e-9302-414b-b0e8-640d1b41ebcd	t	\N	t
04ad29f7-0f46-4042-bd14-0d775f9a80ad	de8718fe-8eed-4c2a-9731-719126c65a46	ded33dd5-a5f6-4c11-a41b-bc4748c51bd1	t	\N	t
51a7d098-ffd8-4b8a-ac63-1276c2f9ee58	e143f84d-1a44-4fb6-bdf3-56c1125696ac	ded33dd5-a5f6-4c11-a41b-bc4748c51bd1	t	\N	t
d0a79a87-99f5-439e-bd02-fb79d387da56	de8718fe-8eed-4c2a-9731-719126c65a46	9671ee99-c2f0-4541-a49b-c7c3d42a5c9f	t	\N	t
62e5026a-4b25-480b-8db6-8a1659c6f9c7	e143f84d-1a44-4fb6-bdf3-56c1125696ac	9671ee99-c2f0-4541-a49b-c7c3d42a5c9f	t	\N	t
dce577fc-e886-4c6c-9a5e-fc0f2b630bbe	de8718fe-8eed-4c2a-9731-719126c65a46	4dfe9fe9-0c59-4fc1-ae67-7c484d343703	t	\N	t
a64fcaa3-1c8f-46de-b17d-0bbdef57d360	e143f84d-1a44-4fb6-bdf3-56c1125696ac	4dfe9fe9-0c59-4fc1-ae67-7c484d343703	t	\N	t
2347d68c-5ebd-43e3-bbfb-f513a0c1e125	de8718fe-8eed-4c2a-9731-719126c65a46	639ad892-e843-430a-8577-933d23085a8e	t	\N	t
f39850be-64aa-4443-8a6c-d9665feecc8f	e143f84d-1a44-4fb6-bdf3-56c1125696ac	639ad892-e843-430a-8577-933d23085a8e	t	\N	t
95485411-90bb-4b76-b73f-d5d788e79653	de8718fe-8eed-4c2a-9731-719126c65a46	a92b5f46-cbb0-40e4-aa49-c74cf99df6ea	t	\N	t
f0729293-8664-4e2b-9f7a-12da8b9ae938	e143f84d-1a44-4fb6-bdf3-56c1125696ac	a92b5f46-cbb0-40e4-aa49-c74cf99df6ea	t	\N	t
d555177f-0ed9-417c-9e1e-6c2a415e1adf	de8718fe-8eed-4c2a-9731-719126c65a46	72d3c4ec-6294-48e3-9449-d1da20dc563e	t	\N	t
cb7f3f7b-1cb2-4fbf-97ee-2a7c57fbe400	e143f84d-1a44-4fb6-bdf3-56c1125696ac	72d3c4ec-6294-48e3-9449-d1da20dc563e	t	\N	t
0d1f19b6-e3af-462a-9d7e-1d6bb7852b01	de8718fe-8eed-4c2a-9731-719126c65a46	4f67c495-150e-434b-90cd-e96baf6d1e53	t	\N	t
44b7a8d3-3709-40c6-bcf9-d03a5e08efcd	e143f84d-1a44-4fb6-bdf3-56c1125696ac	4f67c495-150e-434b-90cd-e96baf6d1e53	t	\N	t
dd33263d-b205-4f97-b62e-65256ca6c249	de8718fe-8eed-4c2a-9731-719126c65a46	9b5a4870-a1f5-4cac-a04e-b628c4b0f5e5	t	\N	t
e76e3d20-b687-49d0-bd5b-9a422c6d3517	e143f84d-1a44-4fb6-bdf3-56c1125696ac	9b5a4870-a1f5-4cac-a04e-b628c4b0f5e5	t	\N	t
9a5c1150-283f-4e6e-8e74-381bdea9a5d0	de8718fe-8eed-4c2a-9731-719126c65a46	8f802668-0e5d-4d2e-bd34-119dc3632ef4	t	\N	t
245402cd-bee0-4adf-801d-6102b5b668cd	e143f84d-1a44-4fb6-bdf3-56c1125696ac	8f802668-0e5d-4d2e-bd34-119dc3632ef4	t	\N	t
2f671c1e-5190-459f-aa25-5aca37e13120	de8718fe-8eed-4c2a-9731-719126c65a46	f66fa165-02a6-4994-a03e-ee039684ca2e	t	\N	t
6ac5fdbe-8a6a-4b06-a4d7-77965e08acfb	e143f84d-1a44-4fb6-bdf3-56c1125696ac	f66fa165-02a6-4994-a03e-ee039684ca2e	t	\N	t
ae15f5ef-cac6-4842-95b9-69606717de2c	de8718fe-8eed-4c2a-9731-719126c65a46	b86ae786-7ebc-4bce-9d27-c5f7704a5d94	t	\N	t
b97baef0-c4d9-4c7b-be90-361b65fe60bc	e143f84d-1a44-4fb6-bdf3-56c1125696ac	b86ae786-7ebc-4bce-9d27-c5f7704a5d94	t	\N	t
beb8a807-94af-4f69-9d84-4764f4183bb1	de8718fe-8eed-4c2a-9731-719126c65a46	e84b14f0-ca8b-425b-97f0-df7ce75032ff	t	\N	t
eb139b3d-4847-46eb-a68d-ff642bc6b176	e143f84d-1a44-4fb6-bdf3-56c1125696ac	e84b14f0-ca8b-425b-97f0-df7ce75032ff	t	\N	t
72c479e8-ba63-452b-8916-fe3edf493e80	de8718fe-8eed-4c2a-9731-719126c65a46	fb650082-3d32-4048-b914-32ce922f0a4a	t	\N	t
392ea0db-78e5-448f-a9e6-d477bfd08877	e143f84d-1a44-4fb6-bdf3-56c1125696ac	fb650082-3d32-4048-b914-32ce922f0a4a	t	\N	t
4a6f38db-894c-4d9f-97ec-735ca76a7ccc	de8718fe-8eed-4c2a-9731-719126c65a46	f60bd9b7-465f-4903-8635-8f02a46a818e	t	\N	t
34bdb10c-c75b-4ce9-a398-c0c0287dabc4	e143f84d-1a44-4fb6-bdf3-56c1125696ac	f60bd9b7-465f-4903-8635-8f02a46a818e	t	\N	t
09f3379a-5f17-4156-b87e-872fdbe08b95	de8718fe-8eed-4c2a-9731-719126c65a46	3a2d87d4-c032-494d-9d27-c0ea466dabeb	t	\N	t
de7bc3f4-634e-4d89-af3e-f4a93f50ca4a	e143f84d-1a44-4fb6-bdf3-56c1125696ac	3a2d87d4-c032-494d-9d27-c0ea466dabeb	t	\N	t
32f4b96a-d7f5-41ac-a865-1aaa4a5f824c	de8718fe-8eed-4c2a-9731-719126c65a46	94e172ad-6678-44d5-8021-ebd46ea3cd61	t	\N	t
c698dd3f-4d7c-467d-a0dc-c96411601066	e143f84d-1a44-4fb6-bdf3-56c1125696ac	94e172ad-6678-44d5-8021-ebd46ea3cd61	t	\N	t
a157aecf-8d3a-4c33-9e56-a9055617e68c	de8718fe-8eed-4c2a-9731-719126c65a46	cfdc2823-559b-4fae-ae65-f22db521c611	t	\N	t
002149e0-99c3-4e5d-96bc-65beb4fa8cc3	e143f84d-1a44-4fb6-bdf3-56c1125696ac	cfdc2823-559b-4fae-ae65-f22db521c611	t	\N	t
a0a02009-4e98-40b0-9682-316ae37f2c5d	de8718fe-8eed-4c2a-9731-719126c65a46	a6d9bd36-2ae7-48f6-bdda-42a85fe8f74d	t	\N	t
af6bc5cf-9588-4196-82f4-2aa48cb2b6a5	e143f84d-1a44-4fb6-bdf3-56c1125696ac	a6d9bd36-2ae7-48f6-bdda-42a85fe8f74d	t	\N	t
9b4c2b8d-eb1c-43c7-97a6-0696dfe53932	de8718fe-8eed-4c2a-9731-719126c65a46	374001d2-a123-4e0d-becb-0335135cdf5d	t	\N	t
50a64e05-19da-41f4-8255-126238343d01	e143f84d-1a44-4fb6-bdf3-56c1125696ac	374001d2-a123-4e0d-becb-0335135cdf5d	t	\N	t
1cf6023d-4a85-48fb-8251-981886da5520	de8718fe-8eed-4c2a-9731-719126c65a46	c9d0909f-79ff-4d07-8122-4158d5bd5cae	t	\N	t
9fc145df-7546-4c55-acd0-cf922e2f46dc	e143f84d-1a44-4fb6-bdf3-56c1125696ac	c9d0909f-79ff-4d07-8122-4158d5bd5cae	t	\N	t
f2ab2e56-1d99-408c-88fd-0d1a60631995	de8718fe-8eed-4c2a-9731-719126c65a46	0fa770cb-2c43-4e75-9b1b-57df5415061a	t	\N	t
c9819be7-0b47-4c3b-aac2-0578eafed61a	e143f84d-1a44-4fb6-bdf3-56c1125696ac	0fa770cb-2c43-4e75-9b1b-57df5415061a	t	\N	t
3c37fc1f-f30e-4bf9-88e0-41f1ebc48684	de8718fe-8eed-4c2a-9731-719126c65a46	88420665-bada-422c-9c3a-03f5d3fdeae1	t	\N	t
52d76341-d2db-4034-b01e-5912e5e7ef47	e143f84d-1a44-4fb6-bdf3-56c1125696ac	88420665-bada-422c-9c3a-03f5d3fdeae1	t	\N	t
17a5697f-afe5-460d-ae74-60a5912861f3	de8718fe-8eed-4c2a-9731-719126c65a46	75e7f8c8-48fa-4946-a468-70b9c9425c18	t	\N	t
ab00b5c1-2bbc-46fd-898f-191da4d15fce	e143f84d-1a44-4fb6-bdf3-56c1125696ac	75e7f8c8-48fa-4946-a468-70b9c9425c18	t	\N	t
9f5d2177-833a-44d1-b7f3-5c2aeda1d9ac	de8718fe-8eed-4c2a-9731-719126c65a46	c70aead0-4c0b-4c08-a100-2eeed3700494	t	\N	t
45eed1a1-fbd1-43a8-9e4e-d9c6bf84f180	e143f84d-1a44-4fb6-bdf3-56c1125696ac	c70aead0-4c0b-4c08-a100-2eeed3700494	t	\N	t
df98d697-1aaa-4dd3-b6e1-43c120c1596d	de8718fe-8eed-4c2a-9731-719126c65a46	a247d3d4-e0a3-49db-bb3f-7a9a433f6819	t	\N	t
b5296f0b-8144-440d-a963-8d42c551a3b0	e143f84d-1a44-4fb6-bdf3-56c1125696ac	a247d3d4-e0a3-49db-bb3f-7a9a433f6819	t	\N	t
8d0569f1-e6b2-49ed-aad5-cda2103dfb57	de8718fe-8eed-4c2a-9731-719126c65a46	d8a3569f-1ba0-44f6-a2f2-44c6f712fbb5	t	\N	t
8ffc4129-3bc7-46f5-b457-5699abccf09c	e143f84d-1a44-4fb6-bdf3-56c1125696ac	d8a3569f-1ba0-44f6-a2f2-44c6f712fbb5	t	\N	t
cfbd2745-d32d-4d27-a158-381e4fea1fa6	de8718fe-8eed-4c2a-9731-719126c65a46	52aeaf42-f293-4c08-9fec-94cdcb499551	t	\N	t
df2d13cb-a85e-4660-95fc-7e5db443ffbb	e143f84d-1a44-4fb6-bdf3-56c1125696ac	52aeaf42-f293-4c08-9fec-94cdcb499551	t	\N	t
70850f92-06ce-4050-a32c-8da6959095fa	de8718fe-8eed-4c2a-9731-719126c65a46	a45359f9-3d2c-4a9b-a3f8-b6ebc55dc925	t	\N	t
fd1bd25e-78d9-42da-8918-ade9a63b59a8	e143f84d-1a44-4fb6-bdf3-56c1125696ac	a45359f9-3d2c-4a9b-a3f8-b6ebc55dc925	t	\N	t
cd4a4c50-8d1e-4efc-bc24-3cb8d23b41b9	de8718fe-8eed-4c2a-9731-719126c65a46	0da667c4-3088-4e38-bfdf-212472f6719c	t	\N	t
b659dcff-9390-415e-a7e2-89e558142410	e143f84d-1a44-4fb6-bdf3-56c1125696ac	0da667c4-3088-4e38-bfdf-212472f6719c	t	\N	t
0563457f-c8a1-43c6-a94e-15ef1f1eebff	de8718fe-8eed-4c2a-9731-719126c65a46	a5ccd467-6369-4631-a5dc-39293394fb51	t	\N	t
29b70ac6-25b4-466c-8c35-d69e108c8c91	e143f84d-1a44-4fb6-bdf3-56c1125696ac	a5ccd467-6369-4631-a5dc-39293394fb51	t	\N	t
c8e5fc60-ae20-460c-b9cd-aced2a326d2a	de8718fe-8eed-4c2a-9731-719126c65a46	dbc3cec7-b232-4f25-94fb-82b670bde493	t	\N	t
bbeedae1-fc2e-43ec-96cd-c0527e4f6b90	e143f84d-1a44-4fb6-bdf3-56c1125696ac	dbc3cec7-b232-4f25-94fb-82b670bde493	t	\N	t
e2cd35c8-8dd3-4a0d-84e1-f2405d47ca70	de8718fe-8eed-4c2a-9731-719126c65a46	9067ec6e-df04-4116-8463-96f0195db394	t	\N	t
ccd13936-d91b-4cde-baa8-63bc8612a1cd	e143f84d-1a44-4fb6-bdf3-56c1125696ac	9067ec6e-df04-4116-8463-96f0195db394	t	\N	t
52b19436-27ec-4f1a-8a66-49ea3156f1bd	de8718fe-8eed-4c2a-9731-719126c65a46	d7aa2b52-58c7-40b3-86cc-9aa1b0cd053a	t	\N	t
10d94b8d-ee8f-4f24-b227-8f838d7d3ac6	e143f84d-1a44-4fb6-bdf3-56c1125696ac	d7aa2b52-58c7-40b3-86cc-9aa1b0cd053a	t	\N	t
af3efae3-a0da-4889-b779-8704f104b090	de8718fe-8eed-4c2a-9731-719126c65a46	f16a3d11-4fdd-4b99-b323-5e410d2e3485	t	\N	t
5c605b5e-669c-4ecc-899d-8db0a68db668	e143f84d-1a44-4fb6-bdf3-56c1125696ac	f16a3d11-4fdd-4b99-b323-5e410d2e3485	t	\N	t
ae6dee7b-b47b-4132-a3c2-141522b02b92	de8718fe-8eed-4c2a-9731-719126c65a46	6f80f510-7258-4cb7-bb49-df77deab70bc	t	\N	t
0c5ab9ed-f9dd-400d-9a79-c28047d53d19	e143f84d-1a44-4fb6-bdf3-56c1125696ac	6f80f510-7258-4cb7-bb49-df77deab70bc	t	\N	t
d94bf839-8c16-4b3a-99c6-4f09d02063d8	de8718fe-8eed-4c2a-9731-719126c65a46	825ee7fd-2c6a-4245-9f5c-634d6d779d15	t	\N	t
a661e039-5d48-409d-bb7c-aafca8a899b7	e143f84d-1a44-4fb6-bdf3-56c1125696ac	825ee7fd-2c6a-4245-9f5c-634d6d779d15	t	\N	t
55f70208-1f9f-462d-975d-71cc41bf2657	de8718fe-8eed-4c2a-9731-719126c65a46	286d2750-a377-4aa1-90fa-cc28f7a585b0	t	\N	t
efe38efa-99fe-42b3-8754-5636d31974cd	e143f84d-1a44-4fb6-bdf3-56c1125696ac	286d2750-a377-4aa1-90fa-cc28f7a585b0	t	\N	t
46c73493-636e-41cc-835c-07e9b2b9adda	de8718fe-8eed-4c2a-9731-719126c65a46	12d41c7b-881d-4b07-9472-f770e2f6e65e	t	\N	t
f087b2ab-61d6-4249-b3a9-e099e788327e	e143f84d-1a44-4fb6-bdf3-56c1125696ac	12d41c7b-881d-4b07-9472-f770e2f6e65e	t	\N	t
07cc20c8-240f-428c-a0a1-014522db2868	de8718fe-8eed-4c2a-9731-719126c65a46	5a23b98a-739f-4e6e-954e-07c8a703bc92	t	\N	t
9b72238e-b6ff-47b6-b19f-2457a3e9bdeb	e143f84d-1a44-4fb6-bdf3-56c1125696ac	5a23b98a-739f-4e6e-954e-07c8a703bc92	t	\N	t
7aa5bdd4-1086-46c4-b0c6-e1d55960af1f	de8718fe-8eed-4c2a-9731-719126c65a46	02ca1b9c-2839-4aaf-a00e-087578f6cd43	t	\N	t
e427db16-5651-4036-bce4-362236fe28e1	e143f84d-1a44-4fb6-bdf3-56c1125696ac	02ca1b9c-2839-4aaf-a00e-087578f6cd43	t	\N	t
428410d8-c7bb-4fd2-be9f-79c3d4fdd6e2	de8718fe-8eed-4c2a-9731-719126c65a46	c7490432-9c5b-4cb0-bd12-ac8b2e70109f	t	\N	t
50c78e13-011e-4c6f-ae39-07674494f1ca	e143f84d-1a44-4fb6-bdf3-56c1125696ac	c7490432-9c5b-4cb0-bd12-ac8b2e70109f	t	\N	t
14ac686b-a48f-4a23-ab0f-f064b7c9792c	de8718fe-8eed-4c2a-9731-719126c65a46	69f9ea59-2c0b-4cec-b8a2-85fbf330ecd1	t	\N	t
8f93d2be-9025-4651-991a-2fd65cd158d8	e143f84d-1a44-4fb6-bdf3-56c1125696ac	69f9ea59-2c0b-4cec-b8a2-85fbf330ecd1	t	\N	t
819f7f53-5e8f-4238-8539-b9de806693ed	de8718fe-8eed-4c2a-9731-719126c65a46	bfdc9bdc-bd8f-4d6c-bab7-64a781eac750	t	\N	t
ecf97509-6999-4ed8-9d16-a26c3670c1ef	e143f84d-1a44-4fb6-bdf3-56c1125696ac	bfdc9bdc-bd8f-4d6c-bab7-64a781eac750	t	\N	t
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.branches (id, "restaurantId", name, slug, address, phone, "countryCode", "isActive", "createdAt", "updatedAt", "isDeleted", "deletedAt", "deletedBy", currency) FROM stdin;
e143f84d-1a44-4fb6-bdf3-56c1125696ac	c7093d5d-30fc-45b9-97a3-06087377d576	Downtown Branch	ananda-non-veg-downtown-branch	102 , Main street	987654323	91	t	2026-10-29 07:12:21.859	2026-10-29 09:04:42.448	f	\N	\N	INR
cce75ec3-1e9b-4e15-a179-d5b0b43a5808	e75df15d-3735-4332-bc45-ab5a73eef323	Chinna chokkikulam branch	ananda-pure-veg-chinna-chokkikulam-branch	Chinna chokkikulam, Madurai	8796868687	91	t	2026-10-29 09:14:50.818	2026-10-29 09:14:50.818	f	\N	\N	INR
638bab36-4376-40d2-9560-0d9afbdf9f11	e75df15d-3735-4332-bc45-ab5a73eef323	Jaihindpuram	ananda-pure-veg-jaihindpuram	Jaihindpuram , Madurai	9876575643	91	t	2026-10-30 13:12:22.861	2026-10-30 13:12:22.861	f	\N	\N	INR
de8718fe-8eed-4c2a-9731-719126c65a46	c7093d5d-30fc-45b9-97a3-06087377d576	Theppakulam	ananda-non-veg-theppakulam	Thappakulam, Madurai	8787867563	91	t	2026-10-30 13:27:38.92	2026-10-30 13:27:38.92	f	\N	\N	INR
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.categories (id, "restaurantId", name, description, "sortOrder", "isActive", "createdAt", "updatedAt", "isDeleted", "deletedAt", "deletedBy") FROM stdin;
26bab23d-b9d6-43a1-b22e-2d5eac220ebc	e75df15d-3735-4332-bc45-ab5a73eef323	Main Dish	Fresh foods	0	t	2026-10-29 09:10:39.307	2026-10-29 09:10:39.307	f	\N	\N
1bea977f-cf92-4a95-a0e3-172aee08da4e	c7093d5d-30fc-45b9-97a3-06087377d576	Soups & Shorbas	Slow-simmered aromatic broths, traditional country soups and warming bowls	1	t	2026-11-14 07:22:25.266	2026-11-14 07:22:25.266	f	\N	\N
a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	c7093d5d-30fc-45b9-97a3-06087377d576	Non-Veg Starters & Appetizers	Crispy fried chicken, pan-seared mutton varuval, and fiery dry roasts	2	t	2026-10-29 07:25:37.512	2026-11-14 07:22:25.74	f	\N	\N
2e0f92dc-9d07-4cb2-a97e-e98eef597edc	c7093d5d-30fc-45b9-97a3-06087377d576	Seafood Delicacies	Fresh sea catches, spiced king fish fry, juicy prawn roasts, and crab curries	3	t	2026-11-14 07:22:26.073	2026-11-14 07:22:26.073	f	\N	\N
d48051f2-4ff5-46b3-8d71-a92da16deb35	c7093d5d-30fc-45b9-97a3-06087377d576	Biryani & Pulao	Legendary wood-fire dum biryanis made with authentic Seeraga Samba and Basmati rice	4	t	2026-11-14 07:22:26.394	2026-11-14 07:22:26.394	f	\N	\N
506860ac-7a1f-442a-a9ce-70ef2fd1b44a	c7093d5d-30fc-45b9-97a3-06087377d576	Non-Veg Gravies & Curries	Stone-ground coconut curries, rich mutton korma, and spicy Chettinad gravies	5	t	2026-11-14 07:22:26.613	2026-11-14 07:22:26.613	f	\N	\N
a6529165-150c-4b01-a51d-0349a2fa1244	c7093d5d-30fc-45b9-97a3-06087377d576	Tandoori & Kebabs	Clay oven delicacies charred over red-hot coals with authentic spices	6	t	2026-11-14 07:22:26.855	2026-11-14 07:22:26.855	f	\N	\N
7acad2bd-9545-4c8f-af76-8d7b29079f7f	c7093d5d-30fc-45b9-97a3-06087377d576	Breads & Parottas	Flaky layered Malabar parottas, Madurai bun parottas, and piping hot kothus	7	t	2026-11-14 07:22:27.099	2026-11-14 07:22:27.099	f	\N	\N
440af1f2-61dd-46f1-8017-cac00427f8f5	c7093d5d-30fc-45b9-97a3-06087377d576	Traditional Meals & Combos	Grand festive banana leaf meals, curated biryani platters, and executive feasts	8	t	2026-11-14 07:22:27.333	2026-11-14 07:22:27.333	f	\N	\N
d7d430c8-0397-4266-9238-8f80ff405af0	c7093d5d-30fc-45b9-97a3-06087377d576	Indo-Chinese Specialties	Flavorsome wok-tossed fried rice, spicy hakka noodles, and Manchurian sauced chicken	9	t	2026-11-14 07:22:27.534	2026-11-14 07:22:27.534	f	\N	\N
adccb351-0ba9-46a6-859b-6d71aa5acb9e	c7093d5d-30fc-45b9-97a3-06087377d576	Desserts & Sweet Endings	Authentic Madurai Jigarthanda, creamy elaneer payasam, and royal Indian sweets	10	t	2026-11-14 07:22:27.764	2026-11-14 07:22:27.764	f	\N	\N
86609375-4c2c-452f-8e8a-4fc488262a6d	c7093d5d-30fc-45b9-97a3-06087377d576	Beverages & Coolers	Refreshing traditional thirst quenchers, Madurai degree coffee, and milk coolers	11	t	2026-11-14 07:22:28.005	2026-11-14 07:22:28.005	f	\N	\N
d20dd5a6-2914-4683-8ccf-64befade0ff3	c7093d5d-30fc-45b9-97a3-06087377d576	Egg Delicacies (Muttai Special)	Iconic Madurai kalaki, fluffy karandi omelettes, and spicy muttai varuval	12	t	2026-11-14 07:33:32.206	2026-11-14 07:33:32.206	f	\N	\N
a1b14c4c-00fb-4af7-867c-538075ca50d3	c7093d5d-30fc-45b9-97a3-06087377d576	Chef's Tiffin Specials	Madurai kari idli, keema parottas, and coin parotta combos drenched in rich gravy	13	t	2026-11-14 07:33:33.091	2026-11-14 07:33:33.091	f	\N	\N
31c6b7b4-78fa-4ec9-986a-6798e2929946	c7093d5d-30fc-45b9-97a3-06087377d576	Mutton Offal & Chukka (Aattukkari Special)	Traditional slow-cooked trotters paaya, spiced brain fry, and tender liver chukka	14	t	2026-11-14 07:33:33.78	2026-11-14 07:33:33.78	f	\N	\N
30a54cb0-0807-4328-aeee-0c7cc26ef960	c7093d5d-30fc-45b9-97a3-06087377d576	Country Chicken Specials (Nattu Kozhi Sirappu)	Pallipalayam chicken, Chinthamani roasts, and free-range Kongunadu delicacies	15	t	2026-11-14 07:33:34.499	2026-11-14 07:33:34.499	f	\N	\N
9d85564c-2f28-4506-8f20-d2305f598342	c7093d5d-30fc-45b9-97a3-06087377d576	Accompaniments & Dips (Thottukka)	Roadside mutton salna, street-style empty salnas, raitas, and tangy gravies	16	t	2026-11-14 07:33:35.127	2026-11-14 07:33:35.127	f	\N	\N
3221f85f-3853-4614-8cf3-7b668e487e90	c7093d5d-30fc-45b9-97a3-06087377d576	Quick Rolls & Kebab Wraps	Tandoori chicken kathi rolls, egg parotta wraps, and shawarma pockets	17	t	2026-11-14 07:33:35.698	2026-11-14 07:33:35.698	f	\N	\N
d529fbfa-f95d-46f4-84d1-0327553b1e22	c7093d5d-30fc-45b9-97a3-06087377d576	Signature Rice Bowls & Combos	Hearty one-bowl meals combining ghee rice, pepper chukka, and biryani blends	18	t	2026-11-14 07:33:36.268	2026-11-14 07:33:36.268	f	\N	\N
a4f13b66-2945-4946-b193-52b691f31cde	c7093d5d-30fc-45b9-97a3-06087377d576	Evening Snacks & Fry Bites	Crispy fried chicken pakodas, fish fingers, and mutton kola urundais	19	t	2026-11-14 07:33:36.851	2026-11-14 07:33:36.851	f	\N	\N
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.order_items (id, "orderId", "productId", "productName", quantity, "unitPrice", "totalPrice", notes) FROM stdin;
9db7c0c7-0de3-44ce-9943-a6f1fda5a7ec	5caaaa09-37ea-4117-acf3-f2ad148b1f61	c8afc9c4-0a22-4d93-9e8e-f4a776c02496	Dragon chicken	2	250.00	500.00	Crispy
2688fe0f-00bc-4e20-be02-288d12a749b7	ea1cdf56-41c2-4bb7-98d8-768b2eb13d1c	6a15f672-5c46-48f0-84e8-1ca30ae609a5	Meals	1	120.00	120.00	No pickle
ffe6e9b5-b4a1-40d6-892b-a2bc637574f8	30407cb4-0d09-4be4-88e0-9d1603fe0c0f	6a15f672-5c46-48f0-84e8-1ca30ae609a5	Meals	2	120.00	240.00	\N
63235d73-c3ce-4a6e-9cec-23c6083edf5f	1b3c9f30-49ad-4606-bb58-cdd57af82086	c8afc9c4-0a22-4d93-9e8e-f4a776c02496	Dragon chicken	1	200.00	200.00	\N
72297057-bee6-441b-8223-e6d89ea2bc94	acefd425-a50f-4534-b092-699bd90b9bcd	c8afc9c4-0a22-4d93-9e8e-f4a776c02496	Dragon chicken	1	200.00	200.00	\N
c3096c41-cb34-4d22-a7a2-48d89c737927	11d87454-a03a-4e4b-9105-586f4ce6c50f	c8afc9c4-0a22-4d93-9e8e-f4a776c02496	Dragon chicken	1	200.00	200.00	\N
ec7bc693-b3af-44c6-b0e0-ab654b15e6bd	da089701-58b0-4ca1-aff5-b94450de2c2f	c8afc9c4-0a22-4d93-9e8e-f4a776c02496	Dragon chicken	1	200.00	200.00	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.orders (id, "orderNumber", "restaurantId", "branchId", "tableNumber", "customerName", "customerPhone", "orderNotes", "orderType", status, "paymentMethod", "paymentStatus", subtotal, tax, "totalAmount", "cancelReason", "cancelledAt", "createdAt", "updatedAt") FROM stdin;
5caaaa09-37ea-4117-acf3-f2ad148b1f61	1	c7093d5d-30fc-45b9-97a3-06087377d576	e143f84d-1a44-4fb6-bdf3-56c1125696ac	Table 5	Ramesh Kumar	9840123456	Extra spicy please	DINE_IN	COMPLETED	CASH	PAID	500.00	25.00	525.00	Out of ingredients	2026-11-06 06:31:52.416	2026-11-14 14:35:39.822	2026-11-06 06:31:52.417
ea1cdf56-41c2-4bb7-98d8-768b2eb13d1c	2	e75df15d-3735-4332-bc45-ab5a73eef323	cce75ec3-1e9b-4e15-a179-d5b0b43a5808	Table 2	Priya S	9876500000	Mild spices	DINE_IN	CANCELLED	CASH	PENDING	120.00	6.00	126.00	Out of ingredients	2026-11-06 05:38:31.383	2026-11-14 14:35:39.822	2026-11-06 05:38:31.384
30407cb4-0d09-4be4-88e0-9d1603fe0c0f	3	e75df15d-3735-4332-bc45-ab5a73eef323	cce75ec3-1e9b-4e15-a179-d5b0b43a5808	3	Diner Table 3	N/A	Hot sambar please	DINE_IN	PENDING	CASH	PENDING	240.00	12.00	252.00	\N	\N	2026-11-14 14:35:39.822	2026-11-06 05:59:30.043
acefd425-a50f-4534-b092-699bd90b9bcd	5	c7093d5d-30fc-45b9-97a3-06087377d576	de8718fe-8eed-4c2a-9731-719126c65a46	12	babu	12345654345	less spicy	DINE_IN	CANCELLED	CASH	PENDING	200.00	10.00	210.00	Cancelled by staff	2026-11-06 06:47:12.451	2026-11-14 14:35:39.822	2026-11-06 06:47:12.453
da089701-58b0-4ca1-aff5-b94450de2c2f	7	c7093d5d-30fc-45b9-97a3-06087377d576	de8718fe-8eed-4c2a-9731-719126c65a46	1	babu	8765678765	\N	DINE_IN	PENDING	CASH	PAID	200.00	10.00	210.00	\N	\N	2026-11-14 14:35:39.822	2026-11-12 08:27:15.54
11d87454-a03a-4e4b-9105-586f4ce6c50f	6	c7093d5d-30fc-45b9-97a3-06087377d576	de8718fe-8eed-4c2a-9731-719126c65a46	t1	babu	8765678765	no oil	DINE_IN	PREPARING	CASH	PAID	200.00	10.00	210.00	\N	\N	2026-11-14 14:35:39.822	2026-11-06 07:34:05.464
1b3c9f30-49ad-4606-bb58-cdd57af82086	4	c7093d5d-30fc-45b9-97a3-06087377d576	de8718fe-8eed-4c2a-9731-719126c65a46	12	babu	12345654345	less spicy	DINE_IN	READY	CASH	PAID	200.00	10.00	210.00	\N	\N	2026-11-14 14:35:39.822	2026-11-06 07:33:31.368
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.products (id, "restaurantId", "categoryId", name, description, "basePrice", "imageUrl", "createdAt", "updatedAt", "isDeleted", "deletedAt", "deletedBy") FROM stdin;
ca92a1ab-26ac-44f7-a3f1-0690a7d5b9ad	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Masala Dosa	Served with coconut chutney	20.00	products/1793258852075-267b8910-c3c1-410b-8e64-eb2264984666.jpeg	2026-10-29 07:27:32.077	2026-10-29 07:29:44.227	t	2026-10-29 07:29:44.224	c8b82f45-4ebe-48b3-9024-1466158c6177
6a15f672-5c46-48f0-84e8-1ca30ae609a5	e75df15d-3735-4332-bc45-ab5a73eef323	26bab23d-b9d6-43a1-b22e-2d5eac220ebc	Meals	Served with rice and differnt type sauce	200.00	products/1793265202409-44bb94ea-440e-4853-931f-c6524542983c.png	2026-10-29 09:13:22.412	2026-10-30 12:26:04.508	f	\N	\N
b0699d36-2967-42d9-b46c-86ee549f5915	c7093d5d-30fc-45b9-97a3-06087377d576	1bea977f-cf92-4a95-a0e3-172aee08da4e	Mutton Bone Shorba	Slow-simmered rich mutton bone marrow broth infused with crushed black pepper, shallots, and fragrant Chettinad spices.	180.00	products/mutton-bone-shorba.jpg	2026-11-14 07:22:25.524	2026-11-14 07:22:25.524	f	\N	\N
41eb35a9-418b-4a7d-8283-50a2e9bb5679	c7093d5d-30fc-45b9-97a3-06087377d576	1bea977f-cf92-4a95-a0e3-172aee08da4e	Nattu Kozhi Soup	Traditional free-range country chicken broth simmered with roasted coriander seeds, garlic cloves, and fresh curry leaves.	160.00	products/nattu-kozhi-soup.jpg	2026-11-14 07:22:25.582	2026-11-14 07:22:25.582	f	\N	\N
9e37bb27-3769-46c7-a5bc-5b5fe41f70e0	c7093d5d-30fc-45b9-97a3-06087377d576	1bea977f-cf92-4a95-a0e3-172aee08da4e	Crab Pepper Soup	Fiery aromatic mud crab soup infused with crushed Tellicherry black pepper, cumin, and fresh cilantro.	190.00	products/crab-pepper-soup.jpg	2026-11-14 07:22:25.62	2026-11-14 07:22:25.62	f	\N	\N
f46892a1-0c84-4249-8c04-a239ce23128a	c7093d5d-30fc-45b9-97a3-06087377d576	1bea977f-cf92-4a95-a0e3-172aee08da4e	Chicken Sweet Corn Soup	Warm comforting creamy sweet corn soup with shredded chicken breast and velvety egg drop ribbons.	150.00	products/chicken-sweet-corn-soup.jpg	2026-11-14 07:22:25.662	2026-11-14 07:22:25.662	f	\N	\N
878ae9fb-a74f-4fea-971f-c07b4f3de7a7	c7093d5d-30fc-45b9-97a3-06087377d576	1bea977f-cf92-4a95-a0e3-172aee08da4e	Chicken Hot & Sour Soup	Tangy and spicy thick broth packed with tender chicken strips, black fungus, bamboo shoots, and green chili.	150.00	products/chicken-hot-sour-soup.jpg	2026-11-14 07:22:25.697	2026-11-14 07:22:25.697	f	\N	\N
80368e9c-cb18-45eb-97c0-425ee0d053d5	c7093d5d-30fc-45b9-97a3-06087377d576	1bea977f-cf92-4a95-a0e3-172aee08da4e	Chicken Manchow Soup	Spicy Indo-Chinese chicken garlic soup served piping hot, crowned with crisp fried noodles and scallions.	160.00	products/chicken-manchow-soup.jpg	2026-11-14 07:22:25.733	2026-11-14 07:22:25.733	f	\N	\N
c8afc9c4-0a22-4d93-9e8e-f4a776c02496	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Dragon chicken	Crispy tender chicken strips tossed in fiery sweet-spicy sauce with roasted cashews, bell peppers, and scallions.	200.00	products/1793264878600-b6aa5f99-a40f-4939-8ab9-e13580cedfa6.jpg	2026-10-29 09:07:58.605	2026-11-14 07:22:25.746	f	\N	\N
86470c06-8469-4aef-926f-e3544432fbc8	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Chicken 65	Authentic Chennai style deep-fried boneless chicken bites marinated in spiced curd, Kashmiri chili, and curry leaves.	190.00	products/chicken-65.jpg	2026-11-14 07:22:25.779	2026-11-14 07:22:25.779	f	\N	\N
bca19ba9-9020-417c-9564-4c6424d76e2a	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Pepper Chicken Sukka	Tender pan-seared chicken chunks roasted dry with freshly cracked black pepper, fennel seeds, and caramelized shallots.	220.00	products/pepper-chicken-sukka.jpg	2026-11-14 07:22:25.818	2026-11-14 07:22:25.818	f	\N	\N
bdc15e9e-9651-46b1-b212-d458ef736ab4	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Madurai Mutton Chukka	Iconic tender goat meat slow-roasted in an iron skillet with stone-ground spices, curry leaves, and country shallots.	320.00	products/madurai-mutton-chukka.jpg	2026-11-14 07:22:25.854	2026-11-14 07:22:25.854	f	\N	\N
2b850d11-b9a1-4410-a361-e8a4822d885a	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Madurai Mutton Kola Urundai	Crispy golden fried meatballs made from spiced minced lamb, roasted gram flour, and fresh herbs.	260.00	products/madurai-mutton-kola-urundai.jpg	2026-11-14 07:22:25.967	2026-11-14 07:22:25.967	f	\N	\N
2a1f61e7-02fc-448d-8aea-14cf0d37622c	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Nattu Kozhi Varuval	Free-range country chicken stir-fried dry in rustic village style with freshly pounded masala and gingelly oil.	240.00	products/nattu-kozhi-varuval.jpg	2026-11-14 07:22:26.02	2026-11-14 07:22:26.02	f	\N	\N
14f83dd4-6cc2-4398-8309-8d3af7b3aea9	c7093d5d-30fc-45b9-97a3-06087377d576	a868ce1b-cb60-4ec8-8d6c-ef515cd1feb6	Crispy Chicken Lollipop	Indo-Chinese style frenched chicken winglets marinated in chili garlic, battered, and fried until crunchily golden.	210.00	products/crispy-chicken-lollipop.jpg	2026-11-14 07:22:26.061	2026-11-14 07:22:26.061	f	\N	\N
cd54daab-fc70-4bfd-b3e6-da47b1b21803	c7093d5d-30fc-45b9-97a3-06087377d576	2e0f92dc-9d07-4cb2-a97e-e98eef597edc	Vanjaram Fish Fry (King Fish)	Prime cut seer fish steak seasoned in spicy red chili lemon marinade and shallow-fried crisp on an iron tawa.	360.00	products/vanjaram-fish-fry-king-fish.jpg	2026-11-14 07:22:26.106	2026-11-14 07:22:26.106	f	\N	\N
334c09bc-05a1-4125-9dfd-a65c51b23949	c7093d5d-30fc-45b9-97a3-06087377d576	2e0f92dc-9d07-4cb2-a97e-e98eef597edc	Prawn Ghee Roast	Plump tiger prawns cooked to perfection in rich golden dairy ghee with tangy Byadgi chili masala paste.	340.00	products/prawn-ghee-roast.jpg	2026-11-14 07:22:26.141	2026-11-14 07:22:26.141	f	\N	\N
e0179bc7-0c3f-4215-9776-45324ce91ee5	c7093d5d-30fc-45b9-97a3-06087377d576	2e0f92dc-9d07-4cb2-a97e-e98eef597edc	Chettinad Crab Masala	Fresh mud crab braised semi-dry in a fiery Chettinad shallot, garlic, and freshly cracked black pepper gravy.	350.00	products/chettinad-crab-masala.jpg	2026-11-14 07:22:26.196	2026-11-14 07:22:26.196	f	\N	\N
e8a0b2aa-645a-4423-b675-b23a61227297	c7093d5d-30fc-45b9-97a3-06087377d576	2e0f92dc-9d07-4cb2-a97e-e98eef597edc	Crispy Nethili Fish Fry	Crispy shallow-fried golden anchovies coated in aromatic spice blend with fried green chilies and curry leaves.	190.00	products/crispy-nethili-fish-fry.jpg	2026-11-14 07:22:26.236	2026-11-14 07:22:26.236	f	\N	\N
8f700e21-6b46-4a52-a8ed-72f1fb49388d	c7093d5d-30fc-45b9-97a3-06087377d576	2e0f92dc-9d07-4cb2-a97e-e98eef597edc	Squid Pepper Fry	Tender calamari rings flash-sautéed with cracked Tellicherry black pepper, curry leaves, and sweet onions.	290.00	products/squid-pepper-fry.jpg	2026-11-14 07:22:26.311	2026-11-14 07:22:26.311	f	\N	\N
fba6f1cc-7026-4285-9088-e09b40e3a028	c7093d5d-30fc-45b9-97a3-06087377d576	2e0f92dc-9d07-4cb2-a97e-e98eef597edc	Meen Pollichathu	Fresh coastal fish coated in rich masala, wrapped in tender banana leaves, and pan-charred over low flame.	380.00	products/meen-pollichathu.jpg	2026-11-14 07:22:26.387	2026-11-14 07:22:26.387	f	\N	\N
60a78c4a-9f03-4545-8e2c-ac4408bed34b	c7093d5d-30fc-45b9-97a3-06087377d576	d48051f2-4ff5-46b3-8d71-a92da16deb35	Dindigul Seeraga Samba Chicken Biryani	Signature aromatic short-grain Seeraga Samba rice simmered with tender chicken, curd, mint, and secret whole spices.	240.00	products/dindigul-seeraga-samba-chicken-biryani.jpg	2026-11-14 07:22:26.421	2026-11-14 07:22:26.421	f	\N	\N
a914607f-964e-4c1d-b396-63a2f329abb1	c7093d5d-30fc-45b9-97a3-06087377d576	d48051f2-4ff5-46b3-8d71-a92da16deb35	Thalassery Mutton Biryani	Fragrant kaima rice biryani with succulent bone-in lamb, garnished with golden fried cashews and raisins.	340.00	products/thalassery-mutton-biryani.jpg	2026-11-14 07:22:26.455	2026-11-14 07:22:26.455	f	\N	\N
b24d4437-966f-4dc6-924e-a0fc8ec7b19c	c7093d5d-30fc-45b9-97a3-06087377d576	d48051f2-4ff5-46b3-8d71-a92da16deb35	Hyderabadi Dum Chicken Biryani	Aromatic basmati rice sealed and slow dum-cooked with saffron, rose water, and yogurt-marinated spicy chicken.	260.00	products/hyderabadi-dum-chicken-biryani.jpg	2026-11-14 07:22:26.491	2026-11-14 07:22:26.491	f	\N	\N
5b9d78e7-244d-4436-b62b-01e574b3140d	c7093d5d-30fc-45b9-97a3-06087377d576	d48051f2-4ff5-46b3-8d71-a92da16deb35	Special Prawn Biryani	Seeraga Samba rice layered with juicy masala-spiced ocean prawns, coriander, and caramelized shallots.	360.00	products/special-prawn-biryani.jpg	2026-11-14 07:22:26.53	2026-11-14 07:22:26.53	f	\N	\N
196caa42-2c5b-46e4-a84b-27e49089606b	c7093d5d-30fc-45b9-97a3-06087377d576	d48051f2-4ff5-46b3-8d71-a92da16deb35	Madurai Mutton Kari Soru	Traditional Madurai meat-infused rice cooked in rich lamb marrow stock, tender mutton cubes, and ghee.	350.00	products/madurai-mutton-kari-soru.jpg	2026-11-14 07:22:26.57	2026-11-14 07:22:26.57	f	\N	\N
0186fca2-0eb9-44f1-8809-678ab6ba148d	c7093d5d-30fc-45b9-97a3-06087377d576	d48051f2-4ff5-46b3-8d71-a92da16deb35	Egg Biryani	Flavorful biryani rice served with two golden pan-roasted boiled eggs, spiced brinjal salna, and creamy onion raita.	180.00	products/egg-biryani.jpg	2026-11-14 07:22:26.605	2026-11-14 07:22:26.605	f	\N	\N
2640ef66-b105-40a2-aa73-2b9efd37328f	c7093d5d-30fc-45b9-97a3-06087377d576	506860ac-7a1f-442a-a9ce-70ef2fd1b44a	Chettinad Chicken Curry	Tender chicken simmered slowly in stone-ground coconut, fennel, star anise, and whole red chili gravy.	230.00	products/chettinad-chicken-curry.jpg	2026-11-14 07:22:26.649	2026-11-14 07:22:26.649	f	\N	\N
4780d9b3-23d7-4fda-88c0-03a9e4179ded	c7093d5d-30fc-45b9-97a3-06087377d576	506860ac-7a1f-442a-a9ce-70ef2fd1b44a	Madurai Kari Kuzhambu	Authentic Madurai style rustic mutton curry with bone marrow and tender goat chunks in rich spiced broth.	330.00	products/madurai-kari-kuzhambu.jpg	2026-11-14 07:22:26.686	2026-11-14 07:22:26.686	f	\N	\N
85ccc978-df08-46c7-8e30-5da8c8f57dbf	c7093d5d-30fc-45b9-97a3-06087377d576	506860ac-7a1f-442a-a9ce-70ef2fd1b44a	Butter Chicken Masala	Charcoal-tandoor grilled chicken tikka simmered in a velvety smooth buttery tomato-cashew makhani gravy.	250.00	products/butter-chicken-masala.jpg	2026-11-14 07:22:26.723	2026-11-14 07:22:26.723	f	\N	\N
d24f214d-54b4-4602-9a69-e35e4b2f3106	c7093d5d-30fc-45b9-97a3-06087377d576	506860ac-7a1f-442a-a9ce-70ef2fd1b44a	Alleppey Fish Curry	Fresh catch cooked in delicate coconut milk sauce infused with raw green mangoes, mustard, and curry leaves.	310.00	products/alleppey-fish-curry.jpg	2026-11-14 07:22:26.765	2026-11-14 07:22:26.765	f	\N	\N
4f2440b7-b5aa-476d-8149-22f73c5d30c6	c7093d5d-30fc-45b9-97a3-06087377d576	506860ac-7a1f-442a-a9ce-70ef2fd1b44a	Kadai Chicken	Juicy chicken pieces tossed in wok with crunchy bell peppers, onions, and freshly roasted coriander spice mix.	240.00	products/kadai-chicken.jpg	2026-11-14 07:22:26.804	2026-11-14 07:22:26.804	f	\N	\N
d4b16dee-5993-49ae-b5e2-cf3f7323e586	c7093d5d-30fc-45b9-97a3-06087377d576	506860ac-7a1f-442a-a9ce-70ef2fd1b44a	Nalli Elumbu Kuzhambu	Decadent slow-cooked mutton shank marrow bones simmered in thick peppery village-style gravy.	380.00	products/nalli-elumbu-kuzhambu.jpg	2026-11-14 07:22:26.844	2026-11-14 07:22:26.844	f	\N	\N
043b301a-61c5-4095-af9a-4f20f3bf67b1	c7093d5d-30fc-45b9-97a3-06087377d576	a6529165-150c-4b01-a51d-0349a2fa1244	Tandoori Chicken (Half)	Tender bone-in chicken marinated in spiced hung yogurt, Kashmiri degi mirch, and roasted in high-heat clay tandoor.	260.00	products/tandoori-chicken-half.jpg	2026-11-14 07:22:26.887	2026-11-14 07:22:26.887	f	\N	\N
6936a866-1999-49c3-beb5-eb0f92121769	c7093d5d-30fc-45b9-97a3-06087377d576	a6529165-150c-4b01-a51d-0349a2fa1244	Murgh Malai Tikka	Boneless chicken cubes steeped in fresh dairy cream, hung curd, melted cheese, and fragrant green cardamom.	270.00	products/murgh-malai-tikka.jpg	2026-11-14 07:22:26.929	2026-11-14 07:22:26.929	f	\N	\N
912ee97c-0d6a-4954-ba3d-a4eff9897119	c7093d5d-30fc-45b9-97a3-06087377d576	a6529165-150c-4b01-a51d-0349a2fa1244	Mutton Seekh Kebab	Spiced minced goat meat blended with chopped mint, coriander, and ginger, skewers grilled over glowing coals.	320.00	products/mutton-seekh-kebab.jpg	2026-11-14 07:22:26.971	2026-11-14 07:22:26.971	f	\N	\N
6b5c41b3-673e-4353-ba80-10c106f1a1f7	c7093d5d-30fc-45b9-97a3-06087377d576	a6529165-150c-4b01-a51d-0349a2fa1244	Hariyali Chicken Kebab	Juicy chicken bites coated in emerald green marinade of fresh garden mint, coriander leaves, and green chilies.	250.00	products/hariyali-chicken-kebab.jpg	2026-11-14 07:22:27.011	2026-11-14 07:22:27.011	f	\N	\N
9470580d-5519-455f-914d-8e4e740ce529	c7093d5d-30fc-45b9-97a3-06087377d576	a6529165-150c-4b01-a51d-0349a2fa1244	Fish Tikka	Boneless fish cubes marinated in roasted gram flour, carom seeds (ajwain), and mustard oil, grilled in tandoor.	330.00	products/fish-tikka.jpg	2026-11-14 07:22:27.048	2026-11-14 07:22:27.048	f	\N	\N
1d015b19-410d-43f3-bc46-5c1537d0742c	c7093d5d-30fc-45b9-97a3-06087377d576	a6529165-150c-4b01-a51d-0349a2fa1244	Tangdi Kebab	Plump chicken drumsticks stuffed with savory minced meat, cheese, and grilled to juicy golden perfection.	280.00	products/tangdi-kebab.jpg	2026-11-14 07:22:27.089	2026-11-14 07:22:27.089	f	\N	\N
0c1e01dc-a7fe-4a58-853b-76b3b9285b44	c7093d5d-30fc-45b9-97a3-06087377d576	7acad2bd-9545-4c8f-af76-8d7b29079f7f	Malabar Parotta (2 Pcs)	Signature flaky, golden, layered flatbread beaten hot and served with complimentary non-veg salna.	60.00	products/malabar-parotta-2-pcs.jpg	2026-11-14 07:22:27.128	2026-11-14 07:22:27.128	f	\N	\N
71ec03b6-9c23-4a24-b7a8-223baa103d1d	c7093d5d-30fc-45b9-97a3-06087377d576	7acad2bd-9545-4c8f-af76-8d7b29079f7f	Madurai Bun Parotta	Iconic Madurai spiral layered bread, deeply fried golden-crisp on outside and soft pillowy inside.	50.00	products/madurai-bun-parotta.jpg	2026-11-14 07:22:27.172	2026-11-14 07:22:27.172	f	\N	\N
e300ec77-4ed2-4f9b-8964-4669d20b0ca7	c7093d5d-30fc-45b9-97a3-06087377d576	7acad2bd-9545-4c8f-af76-8d7b29079f7f	Ceylon Egg Kothu Parotta	Flaky parotta shredded and vigorously beaten on hot tawa with fluffy eggs, onions, green chili, and chicken salna.	180.00	products/ceylon-egg-kothu-parotta.jpg	2026-11-14 07:22:27.216	2026-11-14 07:22:27.216	f	\N	\N
e4da9777-a1ca-4bb2-927e-128dc2a3caa1	c7093d5d-30fc-45b9-97a3-06087377d576	7acad2bd-9545-4c8f-af76-8d7b29079f7f	Chicken Kothu Parotta	Tawa-shredded flaky parotta stir-fried with tender chicken chunks, scrambled egg, curry leaves, and spicy salna.	220.00	products/chicken-kothu-parotta.jpg	2026-11-14 07:22:27.249	2026-11-14 07:22:27.249	f	\N	\N
46cb2c24-97af-47e3-b86c-e825f5eeb766	c7093d5d-30fc-45b9-97a3-06087377d576	7acad2bd-9545-4c8f-af76-8d7b29079f7f	Madurai Mutton Kari Dosa	Thick savory sponge dosa layered with fluffy beaten egg and generous topping of fiery minced mutton chukka.	260.00	products/madurai-mutton-kari-dosa.jpg	2026-11-14 07:22:27.285	2026-11-14 07:22:27.285	f	\N	\N
2906d765-1138-4c76-885e-77b2b29c382a	c7093d5d-30fc-45b9-97a3-06087377d576	7acad2bd-9545-4c8f-af76-8d7b29079f7f	Garlic Butter Naan	Tandoor baked leavened bread brushed generously with minced garlic and melted salted dairy butter.	70.00	products/garlic-butter-naan.jpg	2026-11-14 07:22:27.323	2026-11-14 07:22:27.323	f	\N	\N
12f16a86-c59f-4bf8-9f38-96d6cd5136d1	c7093d5d-30fc-45b9-97a3-06087377d576	440af1f2-61dd-46f1-8017-cac00427f8f5	Ananda Non-Veg Special Thali	Grand banana leaf feast with Ponni rice, mutton gravy, chicken curry, fish curry, rasam, curd, and appalam.	360.00	products/ananda-non-veg-special-thali.jpg	2026-11-14 07:22:27.364	2026-11-14 07:22:27.364	f	\N	\N
c1fa132a-898d-4c53-bbf0-835a80de1958	c7093d5d-30fc-45b9-97a3-06087377d576	440af1f2-61dd-46f1-8017-cac00427f8f5	Chicken Biryani Combo Meal	Dindigul chicken biryani served with crispy chicken 65 (2 pcs), spiced boiled egg, salna, raita, and sweet.	310.00	products/chicken-biryani-combo-meal.jpg	2026-11-14 07:22:27.398	2026-11-14 07:22:27.398	f	\N	\N
4d9a5264-0a40-438b-ba5e-5d64a28a6bed	c7093d5d-30fc-45b9-97a3-06087377d576	440af1f2-61dd-46f1-8017-cac00427f8f5	Mutton Feast Meal	Complete South Indian meals served with side of Madurai mutton chukka, bone broth, and fluffy egg omelette.	440.00	products/mutton-feast-meal.jpg	2026-11-14 07:22:27.429	2026-11-14 07:22:27.429	f	\N	\N
72128d74-865a-4935-bfc1-275a7f6e8f5b	c7093d5d-30fc-45b9-97a3-06087377d576	440af1f2-61dd-46f1-8017-cac00427f8f5	Seafood Platter Combo	Steamed rice with Alleppey fish curry, Vanjaram fish fry steak, crispy prawn masala, and pepper rasam.	480.00	products/seafood-platter-combo.jpg	2026-11-14 07:22:27.461	2026-11-14 07:22:27.461	f	\N	\N
84688a0f-e586-4b4c-a1ad-6bb5ba1c8add	c7093d5d-30fc-45b9-97a3-06087377d576	440af1f2-61dd-46f1-8017-cac00427f8f5	Executive Chicken Meal Box	Single diner box with steamed rice, home-style chicken curry, boiled egg, Malabar parotta (1 pc), and sweet.	240.00	products/executive-chicken-meal-box.jpg	2026-11-14 07:22:27.494	2026-11-14 07:22:27.494	f	\N	\N
468f1247-44de-4b61-b9f6-2978ae91fe28	c7093d5d-30fc-45b9-97a3-06087377d576	440af1f2-61dd-46f1-8017-cac00427f8f5	Country Chicken Feast	Rustic Nattu Kozhi curry, hot white rice, traditional pepper rasam, and country chicken sukka side.	380.00	products/country-chicken-feast.jpg	2026-11-14 07:22:27.527	2026-11-14 07:22:27.527	f	\N	\N
3dbee714-f008-46e8-8de3-1fcce0a3ee17	c7093d5d-30fc-45b9-97a3-06087377d576	d7d430c8-0397-4266-9238-8f80ff405af0	Chilli Chicken Gravy	Tender wok-tossed chicken chunks with crunchy capsicum, sweet onions, green chilies, and dark soy reduction.	220.00	products/chilli-chicken-gravy.jpg	2026-11-14 07:22:27.564	2026-11-14 07:22:27.564	f	\N	\N
95090903-0552-4e7b-8c92-3748b7189e0a	c7093d5d-30fc-45b9-97a3-06087377d576	d7d430c8-0397-4266-9238-8f80ff405af0	Chicken Fried Rice	Fragrant long-grain rice tossed in piping wok with scrambled egg, shredded chicken, and spring onions.	210.00	products/chicken-fried-rice.jpg	2026-11-14 07:22:27.599	2026-11-14 07:22:27.599	f	\N	\N
5bdc7d40-18b1-4ca7-8bc4-44ba491c39c2	c7093d5d-30fc-45b9-97a3-06087377d576	d7d430c8-0397-4266-9238-8f80ff405af0	Schezwan Chicken Noodles	Wok-fried Hakka noodles stir-fried with juicy chicken strips, cabbage, and homemade spicy Schezwan sauce.	220.00	products/schezwan-chicken-noodles.jpg	2026-11-14 07:22:27.636	2026-11-14 07:22:27.636	f	\N	\N
6d87e097-9f09-43c8-a881-c3c50541f97d	c7093d5d-30fc-45b9-97a3-06087377d576	d7d430c8-0397-4266-9238-8f80ff405af0	Prawn Fried Rice	Classic wok-tossed rice loaded with plump butter-fried tiger prawns, egg shreds, and garlic scallions.	260.00	products/prawn-fried-rice.jpg	2026-11-14 07:22:27.692	2026-11-14 07:22:27.692	f	\N	\N
869fcf50-b938-4b83-a029-45d0d0fb423f	c7093d5d-30fc-45b9-97a3-06087377d576	d7d430c8-0397-4266-9238-8f80ff405af0	Crispy Honey Chilli Chicken	Crunchy batter-fried chicken tossed in a glossy glaze of spicy red chili paste, toasted sesame, and honey.	230.00	products/crispy-honey-chilli-chicken.jpg	2026-11-14 07:22:27.724	2026-11-14 07:22:27.724	f	\N	\N
25d01cf4-eee4-4b15-a247-3b356edea9a6	c7093d5d-30fc-45b9-97a3-06087377d576	d7d430c8-0397-4266-9238-8f80ff405af0	Chicken Manchurian	Tender chicken meatballs wok-simmered in tangy soy-garlic coriander gravy with green chilies.	220.00	products/chicken-manchurian.jpg	2026-11-14 07:22:27.757	2026-11-14 07:22:27.757	f	\N	\N
a767bd96-bb65-44a0-b738-f73fc6718985	c7093d5d-30fc-45b9-97a3-06087377d576	adccb351-0ba9-46a6-859b-6d71aa5acb9e	Madurai Jigarthanda Special	Iconic Madurai dessert drink prepared with almond gum (badam pisin), nannari syrup, basundi, and ice cream.	110.00	products/madurai-jigarthanda-special.jpg	2026-11-14 07:22:27.792	2026-11-14 07:22:27.792	f	\N	\N
09294bda-5d4a-4990-ac57-b84d11d53ad1	c7093d5d-30fc-45b9-97a3-06087377d576	adccb351-0ba9-46a6-859b-6d71aa5acb9e	Elaneer Payasam	Creamy luxurious pudding prepared with freshly harvested tender coconut pulp, coconut milk, and cardamom.	130.00	products/elaneer-payasam.jpg	2026-11-14 07:22:27.831	2026-11-14 07:22:27.831	f	\N	\N
e26e2caa-6667-4794-9fac-950de2b16a76	c7093d5d-30fc-45b9-97a3-06087377d576	adccb351-0ba9-46a6-859b-6d71aa5acb9e	Gulab Jamun with Ice Cream	Warm golden khoya dumplings steeped in rose cardamom syrup served beside a scoop of vanilla ice cream.	100.00	products/gulab-jamun-with-ice-cream.jpg	2026-11-14 07:22:27.891	2026-11-14 07:22:27.891	f	\N	\N
74a672ba-6289-42d5-911d-dc546f43b3ed	c7093d5d-30fc-45b9-97a3-06087377d576	adccb351-0ba9-46a6-859b-6d71aa5acb9e	Royal Shahi Tukda	Crispy ghee-fried bread triangles soaked in saffron sugar syrup, smothered in rich thickened rabri and pistachios.	120.00	products/royal-shahi-tukda.jpg	2026-11-14 07:22:27.922	2026-11-14 07:22:27.922	f	\N	\N
73ad2b46-d61f-4bb1-9889-4179d21c96e9	c7093d5d-30fc-45b9-97a3-06087377d576	adccb351-0ba9-46a6-859b-6d71aa5acb9e	Matka Kulfi	Traditional slow-churned creamy dense Indian ice cream infused with saffron and pistachios in a clay pot.	90.00	products/matka-kulfi.jpg	2026-11-14 07:22:27.96	2026-11-14 07:22:27.96	f	\N	\N
01315247-057f-4b57-8a7b-fae54e135196	c7093d5d-30fc-45b9-97a3-06087377d576	adccb351-0ba9-46a6-859b-6d71aa5acb9e	Mango Malai Kulfi	Rich creamy kulfi stick made with 100% natural Alphonso mango pulp and condensed milk.	100.00	products/mango-malai-kulfi.jpg	2026-11-14 07:22:27.998	2026-11-14 07:22:27.998	f	\N	\N
78134583-a0e9-4043-91cd-9a4b1e90e5c0	c7093d5d-30fc-45b9-97a3-06087377d576	86609375-4c2c-452f-8e8a-4fc488262a6d	Nannari Sarbath	Traditional Ayurvedic cooling root syrup beverage served ice-cold with freshly squeezed lime juice.	60.00	products/nannari-sarbath.jpg	2026-11-14 07:22:28.033	2026-11-14 07:22:28.033	f	\N	\N
b39e6b7f-320a-4833-8b2c-decf82428aac	c7093d5d-30fc-45b9-97a3-06087377d576	86609375-4c2c-452f-8e8a-4fc488262a6d	Masala Butter Milk (Neer Mor)	Refreshing churned yogurt cooler tempered with crushed ginger, green chili, asafoetida, and curry leaves.	50.00	products/masala-butter-milk-neer-mor.jpg	2026-11-14 07:22:28.064	2026-11-14 07:22:28.064	f	\N	\N
83a99826-8a1f-4bb6-abb5-27a17465ae5b	c7093d5d-30fc-45b9-97a3-06087377d576	86609375-4c2c-452f-8e8a-4fc488262a6d	Fresh Lime Soda	Effervescent chilled soda stirred with fresh lime juice, mint leaves, and a pinch of black rock salt.	50.00	products/fresh-lime-soda.jpg	2026-11-14 07:22:28.096	2026-11-14 07:22:28.096	f	\N	\N
d35feaf3-6d0a-48f3-bcf4-3d2d1605688e	c7093d5d-30fc-45b9-97a3-06087377d576	86609375-4c2c-452f-8e8a-4fc488262a6d	Madurai Degree Filter Coffee	Freshly brewed dark chicory decoction whipped with hot foaming full-cream milk in traditional brass davarah.	45.00	products/madurai-degree-filter-coffee.jpg	2026-11-14 07:22:28.127	2026-11-14 07:22:28.127	f	\N	\N
c909aac4-ace2-49e1-ac72-5579792fdbed	c7093d5d-30fc-45b9-97a3-06087377d576	86609375-4c2c-452f-8e8a-4fc488262a6d	Mango Lassi	Thick luscious chilled yogurt smoothie blended with ripe Alphonso mangoes and a touch of cardamom.	90.00	products/mango-lassi.jpg	2026-11-14 07:22:28.162	2026-11-14 07:22:28.162	f	\N	\N
6a5b7629-b685-4d14-90cf-8157a06f1b50	c7093d5d-30fc-45b9-97a3-06087377d576	86609375-4c2c-452f-8e8a-4fc488262a6d	Rose Milk Cooler	Fragrant vintage rose syrup blended with chilled milk and soaked sweet sabja basil seeds.	60.00	products/rose-milk-cooler.jpg	2026-11-14 07:22:28.193	2026-11-14 07:22:28.193	f	\N	\N
34471e01-e9f9-42e7-ac71-0dadde477753	c7093d5d-30fc-45b9-97a3-06087377d576	d20dd5a6-2914-4683-8ccf-64befade0ff3	Madurai Muttai Kalaki	Soft, creamy half-cooked egg pouch infused with rich mutton salna and freshly cracked black pepper.	50.00	products/madurai-muttai-kalaki.jpg	2026-11-14 07:33:32.644	2026-11-14 07:33:32.644	f	\N	\N
674bd64e-afc9-4fa4-b5ec-d8ca36d0e34f	c7093d5d-30fc-45b9-97a3-06087377d576	d20dd5a6-2914-4683-8ccf-64befade0ff3	Karandi Omelette	Fluffy spherical country egg omelette fried in a deep iron ladle with shallots, curry leaves, and green chilies.	70.00	products/karandi-omelette.jpg	2026-11-14 07:33:32.732	2026-11-14 07:33:32.732	f	\N	\N
11fed668-0b2c-4bbe-b012-31648f01271c	c7093d5d-30fc-45b9-97a3-06087377d576	d20dd5a6-2914-4683-8ccf-64befade0ff3	Spicy Muttai Podimas	Country eggs scrambled dry on iron tawa with crushed pepper, cumin, chopped onions, and curry leaves.	90.00	products/spicy-muttai-podimas.jpg	2026-11-14 07:33:32.8	2026-11-14 07:33:32.8	f	\N	\N
e197490e-523e-48cd-b896-41d92028e3a7	c7093d5d-30fc-45b9-97a3-06087377d576	d20dd5a6-2914-4683-8ccf-64befade0ff3	Boiled Egg Pepper Fry	Golden pan-seared hard boiled eggs coated in roasted Tellicherry pepper and caramelized shallot paste.	100.00	products/boiled-egg-pepper-fry.jpg	2026-11-14 07:33:32.895	2026-11-14 07:33:32.895	f	\N	\N
05739c0e-9302-414b-b0e8-640d1b41ebcd	c7093d5d-30fc-45b9-97a3-06087377d576	d20dd5a6-2914-4683-8ccf-64befade0ff3	Nattu Kozhi Muttai Omelette	Double free-range country egg omelette whipped with crushed peppercorns and cold-pressed sesame oil.	80.00	products/nattu-kozhi-muttai-omelette.jpg	2026-11-14 07:33:32.997	2026-11-14 07:33:32.997	f	\N	\N
ded33dd5-a5f6-4c11-a41b-bc4748c51bd1	c7093d5d-30fc-45b9-97a3-06087377d576	d20dd5a6-2914-4683-8ccf-64befade0ff3	Muttai Salna Roast	Pan-roasted boiled eggs simmered semi-dry in aromatic spiced coconut-shallot salna gravy.	110.00	products/muttai-salna-roast.jpg	2026-11-14 07:33:33.081	2026-11-14 07:33:33.081	f	\N	\N
9671ee99-c2f0-4541-a49b-c7c3d42a5c9f	c7093d5d-30fc-45b9-97a3-06087377d576	a1b14c4c-00fb-4af7-867c-538075ca50d3	Madurai Kari Idli (3 Pcs)	Steaming soft rice idlis generously drenched in slow-simmered rich mutton bone gravy.	180.00	products/madurai-kari-idli-3-pcs.jpg	2026-11-14 07:33:33.171	2026-11-14 07:33:33.171	f	\N	\N
4dfe9fe9-0c59-4fc1-ae67-7c484d343703	c7093d5d-30fc-45b9-97a3-06087377d576	a1b14c4c-00fb-4af7-867c-538075ca50d3	Stuffed Keema Parotta	Flaky golden layered parotta stuffed with spiced minced mutton keema, served with thick salna.	210.00	products/stuffed-keema-parotta.jpg	2026-11-14 07:33:33.302	2026-11-14 07:33:33.302	f	\N	\N
639ad892-e843-430a-8577-933d23085a8e	c7093d5d-30fc-45b9-97a3-06087377d576	a1b14c4c-00fb-4af7-867c-538075ca50d3	Chicken Podi Dosa	Crisp ghee roast dosa smeared with signature spicy non-veg gun powder and shredded chicken.	190.00	products/chicken-podi-dosa.jpg	2026-11-14 07:33:33.434	2026-11-14 07:33:33.434	f	\N	\N
a92b5f46-cbb0-40e4-aa49-c74cf99df6ea	c7093d5d-30fc-45b9-97a3-06087377d576	a1b14c4c-00fb-4af7-867c-538075ca50d3	Coin Parotta with Salna (5 Pcs)	Bite-sized crispy flaky layered parottas served with steaming piping-hot roadside salna.	120.00	products/coin-parotta-with-salna-5-pcs.jpg	2026-11-14 07:33:33.553	2026-11-14 07:33:33.553	f	\N	\N
72d3c4ec-6294-48e3-9449-d1da20dc563e	c7093d5d-30fc-45b9-97a3-06087377d576	a1b14c4c-00fb-4af7-867c-538075ca50d3	Muttai Veechu Parotta	Air-stretched thin gossamer parotta folded with seasoned egg, pepper, and diced shallots.	130.00	products/muttai-veechu-parotta.jpg	2026-11-14 07:33:33.647	2026-11-14 07:33:33.647	f	\N	\N
4f67c495-150e-434b-90cd-e96baf6d1e53	c7093d5d-30fc-45b9-97a3-06087377d576	a1b14c4c-00fb-4af7-867c-538075ca50d3	Idiyappam with Mutton Paaya	Delicate steamed rice string hoppers served with rich, fragrant slow-simmered trotters broth.	240.00	products/idiyappam-with-mutton-paaya.jpg	2026-11-14 07:33:33.758	2026-11-14 07:33:33.758	f	\N	\N
9b5a4870-a1f5-4cac-a04e-b628c4b0f5e5	c7093d5d-30fc-45b9-97a3-06087377d576	31c6b7b4-78fa-4ec9-986a-6798e2929946	Mutton Paaya Gravy	Traditional slow-cooked goat trotters stew simmered overnight with stone-ground whole aromatic spices.	310.00	products/mutton-paaya-gravy.jpg	2026-11-14 07:33:33.866	2026-11-14 07:33:33.866	f	\N	\N
8f802668-0e5d-4d2e-bd34-119dc3632ef4	c7093d5d-30fc-45b9-97a3-06087377d576	31c6b7b4-78fa-4ec9-986a-6798e2929946	Madurai Mutton Brain Fry	Delicately poached goat brain sautéed with country shallots, crushed pepper, and turmeric.	260.00	products/madurai-mutton-brain-fry.jpg	2026-11-14 07:33:33.952	2026-11-14 07:33:33.952	f	\N	\N
f66fa165-02a6-4994-a03e-ee039684ca2e	c7093d5d-30fc-45b9-97a3-06087377d576	31c6b7b4-78fa-4ec9-986a-6798e2929946	Mutton Boti Fry	Rustic country-style goat tripe dry-roasted with fiery red chili, crushed garlic, and curry leaves.	220.00	products/mutton-boti-fry.jpg	2026-11-14 07:33:34.182	2026-11-14 07:33:34.182	f	\N	\N
b86ae786-7ebc-4bce-9d27-c5f7704a5d94	c7093d5d-30fc-45b9-97a3-06087377d576	31c6b7b4-78fa-4ec9-986a-6798e2929946	Mutton Liver Pepper Fry	Tender succulent lamb liver pan-seared in roasted Malabar black pepper and shallots.	240.00	products/mutton-liver-pepper-fry.jpg	2026-11-14 07:33:34.318	2026-11-14 07:33:34.318	f	\N	\N
e84b14f0-ca8b-425b-97f0-df7ce75032ff	c7093d5d-30fc-45b9-97a3-06087377d576	31c6b7b4-78fa-4ec9-986a-6798e2929946	Mutton Thala Kari Varuval	Tender goat head meat roasted dry with rustic spices and cold-pressed gingelly oil.	270.00	products/mutton-thala-kari-varuval.jpg	2026-11-14 07:33:34.413	2026-11-14 07:33:34.413	f	\N	\N
fb650082-3d32-4048-b914-32ce922f0a4a	c7093d5d-30fc-45b9-97a3-06087377d576	31c6b7b4-78fa-4ec9-986a-6798e2929946	Nalli Chukka Varuval	Braised mutton shank marrow bones tossed on high-heat iron tawa with fiery Chettinad masala.	360.00	products/nalli-chukka-varuval.jpg	2026-11-14 07:33:34.489	2026-11-14 07:33:34.489	f	\N	\N
f60bd9b7-465f-4903-8635-8f02a46a818e	c7093d5d-30fc-45b9-97a3-06087377d576	30a54cb0-0807-4328-aeee-0c7cc26ef960	Pallipalayam Chicken	Erode specialty rustic chicken shallow-fried with loads of shallots, garlic, and dry red chili flakes.	260.00	products/pallipalayam-chicken.jpg	2026-11-14 07:33:34.619	2026-11-14 07:33:34.619	f	\N	\N
3a2d87d4-c032-494d-9d27-c0ea466dabeb	c7093d5d-30fc-45b9-97a3-06087377d576	30a54cb0-0807-4328-aeee-0c7cc26ef960	Chinthamani Chicken	Kongunadu style boneless rustic chicken sautéed with broken whole red chilies and fresh curry leaves.	250.00	products/chinthamani-chicken.jpg	2026-11-14 07:33:34.731	2026-11-14 07:33:34.731	f	\N	\N
94e172ad-6678-44d5-8021-ebd46ea3cd61	c7093d5d-30fc-45b9-97a3-06087377d576	30a54cb0-0807-4328-aeee-0c7cc26ef960	Nattu Kozhi Milagu Varuval	Tender country chicken dry roast heavily seasoned with stone-ground black pepper and shallots.	270.00	products/nattu-kozhi-milagu-varuval.jpg	2026-11-14 07:33:34.831	2026-11-14 07:33:34.831	f	\N	\N
cfdc2823-559b-4fae-ae65-f22db521c611	c7093d5d-30fc-45b9-97a3-06087377d576	30a54cb0-0807-4328-aeee-0c7cc26ef960	Nattu Kozhi Rasam Soru	Comforting bowl of hot Ponni rice mixed with piping hot country chicken pepper broth and ghee.	220.00	products/nattu-kozhi-rasam-soru.jpg	2026-11-14 07:33:34.949	2026-11-14 07:33:34.949	f	\N	\N
a6d9bd36-2ae7-48f6-bdda-42a85fe8f74d	c7093d5d-30fc-45b9-97a3-06087377d576	30a54cb0-0807-4328-aeee-0c7cc26ef960	Nattu Kozhi Chettinad Masala	Free-range country chicken cooked in an 18-spice freshly roasted Chettinad masala gravy.	280.00	products/nattu-kozhi-chettinad-masala.jpg	2026-11-14 07:33:35.04	2026-11-14 07:33:35.04	f	\N	\N
374001d2-a123-4e0d-becb-0335135cdf5d	c7093d5d-30fc-45b9-97a3-06087377d576	30a54cb0-0807-4328-aeee-0c7cc26ef960	Kongu Nattu Kozhi Biryani	Fragrant Seeraga Samba rice dum-cooked with tender rustic country chicken chunks and mint.	310.00	products/kongu-nattu-kozhi-biryani.jpg	2026-11-14 07:33:35.119	2026-11-14 07:33:35.119	f	\N	\N
c9d0909f-79ff-4d07-8122-4158d5bd5cae	c7093d5d-30fc-45b9-97a3-06087377d576	9d85564c-2f28-4506-8f20-d2305f598342	Special Mutton Salna (Bowl)	Signature spicy thin street-style non-veg gravy infused with poppy seeds, fennel, and coconut.	90.00	products/special-mutton-salna-bowl.jpg	2026-11-14 07:33:35.214	2026-11-14 07:33:35.214	f	\N	\N
0fa770cb-2c43-4e75-9b1b-57df5415061a	c7093d5d-30fc-45b9-97a3-06087377d576	9d85564c-2f28-4506-8f20-d2305f598342	Chicken Salna (Bowl)	Rich aromatic street-cart chicken dipping gravy made fresh for parottas and dosas.	70.00	products/chicken-salna-bowl.jpg	2026-11-14 07:33:35.348	2026-11-14 07:33:35.348	f	\N	\N
88420665-bada-422c-9c3a-03f5d3fdeae1	c7093d5d-30fc-45b9-97a3-06087377d576	9d85564c-2f28-4506-8f20-d2305f598342	Street-Style Plain Salna	Legendary empty roadside salna with authentic tomato, onion, and roasted spice base.	50.00	products/street-style-plain-salna.jpg	2026-11-14 07:33:35.432	2026-11-14 07:33:35.432	f	\N	\N
75e7f8c8-48fa-4946-a468-70b9c9425c18	c7093d5d-30fc-45b9-97a3-06087377d576	9d85564c-2f28-4506-8f20-d2305f598342	Madurai Onion Curd Raita	Chilled fresh yogurt whipped with crunchy chopped shallots, green chilies, and fresh coriander.	40.00	products/madurai-onion-curd-raita.jpg	2026-11-14 07:33:35.512	2026-11-14 07:33:35.512	f	\N	\N
c70aead0-4c0b-4c08-a100-2eeed3700494	c7093d5d-30fc-45b9-97a3-06087377d576	9d85564c-2f28-4506-8f20-d2305f598342	Ennai Kathirikai Gravy	Tender baby eggplants slow-braised in a tangy tamarind, sesame, and non-veg flavored gravy.	80.00	products/ennai-kathirikai-gravy.jpg	2026-11-14 07:33:35.618	2026-11-14 07:33:35.618	f	\N	\N
a247d3d4-e0a3-49db-bb3f-7a9a433f6819	c7093d5d-30fc-45b9-97a3-06087377d576	9d85564c-2f28-4506-8f20-d2305f598342	Non-Veg Meals Sambar & Rasam Set	Piping hot lentil sambar and spicy crushed pepper garlic rasam served with papad.	60.00	products/non-veg-meals-sambar-rasam-set.jpg	2026-11-14 07:33:35.689	2026-11-14 07:33:35.689	f	\N	\N
d8a3569f-1ba0-44f6-a2f2-44c6f712fbb5	c7093d5d-30fc-45b9-97a3-06087377d576	3221f85f-3853-4614-8cf3-7b668e487e90	Chicken Tikka Kathi Roll	Flaky parotta rolled with clay-oven charred chicken tikka, pickled onions, and mint chutney.	170.00	products/chicken-tikka-kathi-roll.jpg	2026-11-14 07:33:35.769	2026-11-14 07:33:35.769	f	\N	\N
52aeaf42-f293-4c08-9fec-94cdcb499551	c7093d5d-30fc-45b9-97a3-06087377d576	3221f85f-3853-4614-8cf3-7b668e487e90	Mutton Keema Roll	Spiced minced lamb keema and fluffy beaten egg wrapped inside a crisp hot parotta.	210.00	products/mutton-keema-roll.jpg	2026-11-14 07:33:35.85	2026-11-14 07:33:35.85	f	\N	\N
a45359f9-3d2c-4a9b-a3f8-b6ebc55dc925	c7093d5d-30fc-45b9-97a3-06087377d576	3221f85f-3853-4614-8cf3-7b668e487e90	Double Egg Parotta Roll	Crispy parotta lined with two whisked eggs, tangy chaat masala, and crunchy red onions.	110.00	products/double-egg-parotta-roll.jpg	2026-11-14 07:33:35.923	2026-11-14 07:33:35.923	f	\N	\N
0da667c4-3088-4e38-bfdf-212472f6719c	c7093d5d-30fc-45b9-97a3-06087377d576	3221f85f-3853-4614-8cf3-7b668e487e90	Crispy Chicken Shawarma Roll	Thin rumali wrap packed with spiced grilled chicken shavings, garlic toum, and pickled veggies.	160.00	products/crispy-chicken-shawarma-roll.jpg	2026-11-14 07:33:36	2026-11-14 07:33:36	f	\N	\N
a5ccd467-6369-4631-a5dc-39293394fb51	c7093d5d-30fc-45b9-97a3-06087377d576	3221f85f-3853-4614-8cf3-7b668e487e90	Chettinad Chicken Wrap	Spicy shredded Chettinad chicken and capsicum wrapped with homemade garlic mayo.	170.00	products/chettinad-chicken-wrap.jpg	2026-11-14 07:33:36.07	2026-11-14 07:33:36.07	f	\N	\N
dbc3cec7-b232-4f25-94fb-82b670bde493	c7093d5d-30fc-45b9-97a3-06087377d576	3221f85f-3853-4614-8cf3-7b668e487e90	Fiery Dragon Chicken Wrap	Crispy tossed Indo-Chinese dragon chicken strips bundled in a warm golden wrap.	180.00	products/fiery-dragon-chicken-wrap.jpg	2026-11-14 07:33:36.252	2026-11-14 07:33:36.252	f	\N	\N
9067ec6e-df04-4116-8463-96f0195db394	c7093d5d-30fc-45b9-97a3-06087377d576	d529fbfa-f95d-46f4-84d1-0327553b1e22	Ghee Rice with Chicken Pepper Chukka	Fragrant Seeraga Samba ghee rice served with hot pepper chicken sukka and gravy.	260.00	products/ghee-rice-with-chicken-pepper-chukka.jpg	2026-11-14 07:33:36.352	2026-11-14 07:33:36.352	f	\N	\N
d7aa2b52-58c7-40b3-86cc-9aa1b0cd053a	c7093d5d-30fc-45b9-97a3-06087377d576	d529fbfa-f95d-46f4-84d1-0327553b1e22	Kothu Biryani Special	Signature fusion of shredded flaky parotta and aromatic mutton biryani tossed on hot tawa.	270.00	products/kothu-biryani-special.jpg	2026-11-14 07:33:36.451	2026-11-14 07:33:36.451	f	\N	\N
f16a3d11-4fdd-4b99-b323-5e410d2e3485	c7093d5d-30fc-45b9-97a3-06087377d576	d529fbfa-f95d-46f4-84d1-0327553b1e22	Curd Rice with Mutton Chukka	Chilled comforting tempered curd rice served alongside fiery dry-roasted tender mutton chukka.	280.00	products/curd-rice-with-mutton-chukka.jpg	2026-11-14 07:33:36.548	2026-11-14 07:33:36.548	f	\N	\N
6f80f510-7258-4cb7-bb49-df77deab70bc	c7093d5d-30fc-45b9-97a3-06087377d576	d529fbfa-f95d-46f4-84d1-0327553b1e22	Sambar Rice with Vanjaram Fry	Hot ghee-laced lentil rice served with a crispy tawa-seared king fish fry steak.	340.00	products/sambar-rice-with-vanjaram-fry.jpg	2026-11-14 07:33:36.644	2026-11-14 07:33:36.644	f	\N	\N
825ee7fd-2c6a-4245-9f5c-634d6d779d15	c7093d5d-30fc-45b9-97a3-06087377d576	d529fbfa-f95d-46f4-84d1-0327553b1e22	Jeera Basmati Rice with Butter Chicken	Cumin-tempered long grain basmati rice accompanied by silky butter chicken makhani.	270.00	products/jeera-basmati-rice-with-butter-chicken.jpg	2026-11-14 07:33:36.729	2026-11-14 07:33:36.729	f	\N	\N
286d2750-a377-4aa1-90fa-cc28f7a585b0	c7093d5d-30fc-45b9-97a3-06087377d576	d529fbfa-f95d-46f4-84d1-0327553b1e22	Schezwan Rice with Chilli Chicken Bowl	Wok-tossed spicy chicken fried rice paired with rich gravy chilli chicken.	250.00	products/schezwan-rice-with-chilli-chicken-bowl.jpg	2026-11-14 07:33:36.821	2026-11-14 07:33:36.821	f	\N	\N
12d41c7b-881d-4b07-9472-f770e2f6e65e	c7093d5d-30fc-45b9-97a3-06087377d576	a4f13b66-2945-4946-b193-52b691f31cde	Madurai Chicken Pakoda	Crispy, crunchy bone-in chicken fritters fried with crushed spices, cashew bits, and curry leaves.	180.00	products/madurai-chicken-pakoda.jpg	2026-11-14 07:33:36.946	2026-11-14 07:33:36.946	f	\N	\N
5a23b98a-739f-4e6e-954e-07c8a703bc92	c7093d5d-30fc-45b9-97a3-06087377d576	a4f13b66-2945-4946-b193-52b691f31cde	Crispy Chicken Popcorn	Tender bite-sized chicken breast poppers seasoned with smoky peri-peri spice dust.	160.00	products/crispy-chicken-popcorn.jpg	2026-11-14 07:33:37.069	2026-11-14 07:33:37.069	f	\N	\N
02ca1b9c-2839-4aaf-a00e-087578f6cd43	c7093d5d-30fc-45b9-97a3-06087377d576	a4f13b66-2945-4946-b193-52b691f31cde	Crispy Mutton Kola Balls (4 Pcs)	Minced mutton spiced balls with crisp golden outer crust and soft flavorful core.	200.00	products/crispy-mutton-kola-balls-4-pcs.jpg	2026-11-14 07:33:37.193	2026-11-14 07:33:37.193	f	\N	\N
c7490432-9c5b-4cb0-bd12-ac8b2e70109f	c7093d5d-30fc-45b9-97a3-06087377d576	a4f13b66-2945-4946-b193-52b691f31cde	Fish Finger Fries	Crispy crumb-coated sea fish batons served with homemade tartar dipping sauce.	220.00	products/fish-finger-fries.jpg	2026-11-14 07:33:37.29	2026-11-14 07:33:37.29	f	\N	\N
69f9ea59-2c0b-4cec-b8a2-85fbf330ecd1	c7093d5d-30fc-45b9-97a3-06087377d576	a4f13b66-2945-4946-b193-52b691f31cde	Golden Prawn Tempura	Plump butterflied ocean prawns fried in light crisp batter with sweet chili dip.	290.00	products/golden-prawn-tempura.jpg	2026-11-14 07:33:37.372	2026-11-14 07:33:37.372	f	\N	\N
bfdc9bdc-bd8f-4d6c-bab7-64a781eac750	c7093d5d-30fc-45b9-97a3-06087377d576	a4f13b66-2945-4946-b193-52b691f31cde	Chicken Keema Samosa (3 Pcs)	Flaky pastry pockets stuffed with minced spiced chicken, onions, and fresh mint.	110.00	products/chicken-keema-samosa-3-pcs.jpg	2026-11-14 07:33:37.454	2026-11-14 07:33:37.454	f	\N	\N
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.restaurants (id, "ownerId", name, slug, description, "logoUrl", "isActive", "createdAt", "updatedAt", "isDeleted", "deletedAt", "deletedBy", "defaultCurrency", "themeConfig", "paymentConfig") FROM stdin;
e75df15d-3735-4332-bc45-ab5a73eef323	c8b82f45-4ebe-48b3-9024-1466158c6177	Ananda Pure veg	ananda-pure-veg	Authentic south indian vegetariian cousine	restaurants/1793256189926-de1b7b23-0b11-483a-9546-4f222192b27f.jpeg	t	2026-10-29 06:43:09.931	2026-11-06 06:06:53.96	f	\N	\N	INR	\N	{"enableCash": true, "enableStripe": false}
c7093d5d-30fc-45b9-97a3-06087377d576	c8b82f45-4ebe-48b3-9024-1466158c6177	Ananda Non veg	ananda-non-veg	Authentic south indian non veg cousine	restaurants/1793256475992-eaea3ff7-8d55-4342-bced-a20681ad52ce.png	t	2026-10-29 06:47:55.994	2026-11-06 06:30:19.152	f	\N	\N	INR	{"dark": {"text": "#fafaf9", "primary": "#f43f5e", "surface": "#1c1014", "textMuted": "#a8a29e", "background": "#09090b"}, "light": {"text": "#1c1917", "primary": "#be123c", "surface": "#ffffff", "textMuted": "#78716c", "background": "#fff1f2"}, "presetId": "crimson"}	{"taxRate": 5, "enableTax": true, "gstNumber": "23456ESDFGHD23", "enableCash": true, "enableStripe": false}
\.


--
-- Data for Name: staff_members; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.staff_members (id, "restaurantId", "userId", role, "assignedBranches", permissions, "isActive", "pinCode", "createdAt", "updatedAt") FROM stdin;
8a9658a4-3e29-4e97-9122-ebc50636e634	c7093d5d-30fc-45b9-97a3-06087377d576	aa9cf653-a75c-43f6-9d00-8e919a7abb66	MANAGER	["e143f84d-1a44-4fb6-bdf3-56c1125696ac"]	{"menu": {"edit": true, "view": true, "create": true, "delete": true, "toggleStock": true}, "staff": {"view": true, "manage": false}, "orders": {"view": true, "accept": true, "cancel": true, "collectCash": true}, "branches": {"edit": true, "view": true, "create": true, "delete": false, "manageTables": true}, "overview": {"view": true, "viewFinancials": true}, "payments": {"view": true, "manage": false}}	t	1234	2026-11-06 10:33:04.301	2026-11-06 10:33:04.301
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: qr_admin
--

COPY public.users (id, email, "passwordHash", name, role, "createdAt", "updatedAt", "countryCode", phone, "deletedAt", "deletedBy", "isDeleted", "isPlatformAdmin") FROM stdin;
aa9cf653-a75c-43f6-9d00-8e919a7abb66	staff@ordzo.com	$2b$10$AtRE833ccCFr1ZGbWGG90uQFJNcyWV6QWffUXGnFa5Hzg/eE/xz0y	Branch Staff	STAFF	2026-11-06 10:33:04.288	2026-11-06 10:33:04.288	+91	8765876587	\N	\N	f	f
c8e8f466-180f-4d00-ab16-c4df7033830f	admin@ordzo.com	$2b$10$AtRE833ccCFr1ZGbWGG90uQFJNcyWV6QWffUXGnFa5Hzg/eE/xz0y	Super Admin	SUPER_ADMIN	2026-11-05 06:35:46.06	2026-11-16 08:12:12.902	+91	9999999999	\N	\N	f	t
980d476d-aa7a-4782-9a84-cd3d51305804	backup-admin@ordzo.com	$2b$10$AtRE833ccCFr1ZGbWGG90uQFJNcyWV6QWffUXGnFa5Hzg/eE/xz0y	Backup Admin	SUPER_ADMIN	2026-11-05 07:19:24.52	2026-11-16 08:12:12.902	+91	9999999999	\N	\N	f	t
c8b82f45-4ebe-48b3-9024-1466158c6177	owner@ordzo.com	$2b$10$AtRE833ccCFr1ZGbWGG90uQFJNcyWV6QWffUXGnFa5Hzg/eE/xz0y	Restaurant Owner	ADMIN	2026-10-22 05:56:22.384	2026-11-16 08:12:12.964	\N	\N	\N	\N	f	f
\.


--
-- Name: orders_orderNumber_seq; Type: SEQUENCE SET; Schema: public; Owner: qr_admin
--

SELECT pg_catalog.setval('public."orders_orderNumber_seq"', 7, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: branch_products branch_products_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.branch_products
    ADD CONSTRAINT branch_products_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: staff_members staff_members_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: branch_products_branchId_productId_key; Type: INDEX; Schema: public; Owner: qr_admin
--

CREATE UNIQUE INDEX "branch_products_branchId_productId_key" ON public.branch_products USING btree ("branchId", "productId");


--
-- Name: branches_slug_key; Type: INDEX; Schema: public; Owner: qr_admin
--

CREATE UNIQUE INDEX branches_slug_key ON public.branches USING btree (slug);


--
-- Name: restaurants_slug_key; Type: INDEX; Schema: public; Owner: qr_admin
--

CREATE UNIQUE INDEX restaurants_slug_key ON public.restaurants USING btree (slug);


--
-- Name: staff_members_restaurantId_idx; Type: INDEX; Schema: public; Owner: qr_admin
--

CREATE INDEX "staff_members_restaurantId_idx" ON public.staff_members USING btree ("restaurantId");


--
-- Name: staff_members_restaurantId_userId_key; Type: INDEX; Schema: public; Owner: qr_admin
--

CREATE UNIQUE INDEX "staff_members_restaurantId_userId_key" ON public.staff_members USING btree ("restaurantId", "userId");


--
-- Name: staff_members_userId_idx; Type: INDEX; Schema: public; Owner: qr_admin
--

CREATE INDEX "staff_members_userId_idx" ON public.staff_members USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: qr_admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: branch_products branch_products_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.branch_products
    ADD CONSTRAINT "branch_products_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: branch_products branch_products_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.branch_products
    ADD CONSTRAINT "branch_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: branches branches_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "branches_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public.restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public.restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public.restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public.restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: restaurants restaurants_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT "restaurants_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_members staff_members_restaurantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT "staff_members_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES public.restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_members staff_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT "staff_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_deletedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: qr_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: qr_admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict lIMFqzSysuqVpeQqaXFLthIxiXrkd90IADYhmlbi80KmT15sHS51jzkGH7PV9FA

