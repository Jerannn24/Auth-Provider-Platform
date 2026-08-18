
---

# Identity Provider & Single Sign-On (SSO) Platform

Sistem manajemen identitas terpusat, penyedia layanan otentikasi (Auth Provider), dan Single Sign-On (SSO) berbasis OAuth2/OIDC.

---

## 1. Identitas

* **Nama:** Junior Natra Situmorang
* **NIM:** 13524055

---

## 2. Technology Stack

| Komponen | Teknologi | Versi |
| --- | --- | --- |
| **Backend Framework** | Express.js / TypeScript | `v5.2.1` / `4.23.12` |
| **Database & ORM** | Prisma ORM | `v7.9.1` |
| **Frontend Framework** | React + Vite / Next.js | `v19.2.8` / `v16.3.0` |
| **Containerization** | Docker & Docker Compose | latest |
| **Security & Cryptography** | `bcrypt`, `crypto`, `jsonwebtoken` | Latest |

---

## 3. Arsitektur & Alur Sistem

### Ringkasan Arsitektur Monorepo

```text
                                  +-----------------------+
                                  |   Browser Client      |
                                  +-----------+-----------+
                                              |
                   +--------------------------+--------------------------+
                   | (Port 3000)                                         | (Port 3001)
                   v                                                     v
      +-------------------------+                           +-------------------------+
      |    Auth Provider UI     |                           |    Application Client   |
      |     (Vite + React)      |                           |    (Next.js App Router) |
      +------------+------------+                           +------------+------------+
                   |                                                     |
                   | (REST API / Port 8080)                              | (Back-Channel Webhook)
                   v                                                     ^
      +-------------------------+                                        |
      |   Auth Provider Core    |                                        |
      |  (Express + Prisma ORM) |                                        |
      +------------+------------+                                        |
                   |                                                     |
      +------------+------------+                           +------------+------------+
      |   PostgreSQL Database   | <--- (Read/Write Queue) - |       Sync Worker       |
      |        (Port 5432)      |                           |   (Background Service)  |
      +-------------------------+                           +-------------------------+

```

### Alur Kerja Otentikasi Utama

1. **Authorization Code Flow:** Aplikasi client mengarahkan user ke `/login` $\rightarrow$ `/authorize`. Setelah otentikasi berhasil, Auth Provider menerbitkan *authorization code* yang ditukarkan aplikasi client menjadi `access_token`.
2. **Back-Channel Logout:** Saat sesi pusat (*sso_session*) berakhir, policy pengguna berubah, atau user mengubah password, Sync Worker mengambil event dari database dan mengirimkan webhook POST ke `/interna/logout` di seluruh aplikasi client terdaftar.

---

## 4. Keputusan Teknis

### A. Pilihan Token (Opaque vs JWT) & Konsekuensinya

* **Central SSO Session (`session_token`):** Menggunakan **Opaque Token** (string acak 32-byte dari `crypto.randomBytes`) yang di-hash dengan **SHA-256** sebelum disimpan di database (`sso_sessions`).
* *Konsekuensi:* Mengorbankan sedikit performa karena memerlukan I/O database pada setiap verifikasi sesi, tetapi memberikan **kontrol pencabutan akses seketika (*instant revocation*)** di seluruh jaringan aplikasi SSO.


* **Access Token:** Menggunakan **Opaque JTI / Token Hash** yang terikat pada `application_id`, `user_id`, dan `sso_session_id`.
* *Konsekuensi:* Memudahkan validasi status aktif (`ACTIVE` vs `REVOKED`) di tingkat aplikasi.

### B. Pilihan Message Broker (DB-backed Queue Worker)

* **Keputusan:** Menggunakan **Custom DB-Backed Event Queue** berbasis tabel `events` dan `event_deliveries` yang dieksekusi oleh service `sync-worker`.
* **Alasan:** Menghindari overhead infrastruktur tambahan (seperti RabbitMQ atau Redis/BullMQ) pada skala sistem saat ini. Worker mendukung fitur *exponential backoff retry*, batas maksimal percobaan (*max attempts*), serta pencatatan otomatis ke **Dead-Letter Queue (DLQ)** jika pengiriman gagal permanen.

### C. Autentikasi Service-to-Service (`/internal/logout`)

* **Keputusan:** Menggunakan **Internal Service Secret (HMAC SHA-256 Signature / Shared Secret Header)** pada panggilan webhook antara `sync-worker` dan endpoint client.
* **Alasan:** Memastikan bahwa endpoint pencabutan sesi lokal hanya menerima perintah resmi dari `sync-worker` dan menolak request dari pihak luar.

### D. Pilihan Soft-Delete vs Hard-Delete

* **Keputusan:** Menggunakan **Soft-Delete / Status State Pattern** (`ACTIVE`, `INACTIVE`, `EXPIRED`, `REVOKED`).
* **Alasan:** Menjaga *referential integrity* relational database untuk riwayat jejak audit (`audit_logs`), serta mencegah kehilangan data historis otentikasi dan transaksi keamanan.

---

## 5. Cara Menjalankan Sistem

### Langkah 1: Persiapan Environment

Salin file `.env.example` menjadi `.env` di direktori utama:

```bash
cp .env.example .env

```

### Langkah 2: Jalankan Container Docker Compose

Jalankan seluruh service (Database, Auth Backend, Auth UI, Sync Worker, dan App Client):

```bash
docker compose up -d --build

```

### Langkah 3: Jalankan Database Migration & Seed Data

Eksekusi Prisma Migration dan seeder data awal dari container backend:

```bash
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npx prisma db seed

```

### URL Akses Tiap Komponen

| Komponen | Endpoint / URL | Keterangan |
| --- | --- | --- |
| **Auth Provider Backend API** | `http://localhost:8080` | Express REST Engine |
| **Auth Provider UI** | `http://localhost:5173` | Halaman Login, MFA, & SSO |
| **Application Client (App A)** | `http://localhost:3001` | Sample Client Application |
| **Application Client (App b)** | `http://localhost:3002` | Sample Client Application |
| **PostgreSQL Database** | `localhost:5432` | Database Server |
| **Control Panel Admin** | `localhost:3000` | Control Panel Admin |

---

## 6. Daftar Endpoint API

### OAuth2 / SSO Engine
`PORT: 8080`
* `GET /authorize` - Endpoint otorisasi OAuth2 (menerbitkan *authorization code*).
* `POST /logout` - Mencabut session saat ini di sso dan mencabut session local di setiap aplikasi
* `POST /login` - Melakukan login untuk membuat sso session
* `POST /change-password` - Mengubah password user dan me-revoked session user terkait
* `POST /token` - Menerbitkan access token dengan jwt code
* `GET /userinfo` - Endpoint yang digunakan untuk mengambil data user

### Control Panel Admin
`PORT 3000`
#### Application Route
* `GET /applications` - Melihat semua data application
* `POST /applications` - Menambahkan data application
* `POST /applications/:id/groups` - Menambahkan Group ke application
* `DELETE /applications/:id/groups` - Menghapus Group ke application
* `PUT /applications/:id/groups` - Memperbarui Group Effect ke application
* `GET /applications/:id/policies` - Melihat Group Policies ke application

#### Group Route
* `GET /groups` - Melihat semua data groups
* `POST /groups` - Menambahkan data groups
* `GET /groups/:id` - Melihat Group berdasarkan id
* `PUT /groups/:id` - Mengubah data Group berdasarkan id
* `DELETE /groups/:id` - Menghapus data Group berdasarkan id
* `GET /groups/:id/users` - Melihat user di group berdasarkan 

#### USER Route
* `GET /users` - Melihat semua data user
* `POST /users` - Menambahkan data user
* `GET /users/:id` - Melihat data user berdasarkan ID
* `PUT /users/:id` - Mengubah data user berdasarkan ID
* `DELETE /users/:id` - Menghapus data user berdasarkan ID
* `GET /users/:id/status` - Melihat status user berdasarkan ID
* `PUT /users/:id/status` - mengubah status user berdasarkan ID

### Application Route
`PORT: 3001 (appA) & 3002(appB)`

* `POST /internal/logout` - Webhook receiver di sisi Client Application untuk mencabut sesi lokal.

---

## 7. Bonus yang Dikerjakan
<!-- On Pregress -->

## 8. Tangkapan Layar (Screenshots)
