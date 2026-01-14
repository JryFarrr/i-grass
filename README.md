This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Flow Project
![WhatsApp Image 2025-10-08 at 06 50 15](https://github.com/user-attachments/assets/51d10260-8af5-41c6-8d0b-7aecb3f32f02)


## Deskripsi Project
Projek ini merupakan website ujian essay dengan sistem Autonomous Grading System atau dinamakan dengan Intelligence Grading System (iGrass). Seringkali dalam penilaian essay guru dan dosen kesulitan dalam menilai secara manual dan membutuhkan *waktu yang lama*. Maka dari itu, iGrass hadir untuk mengotomatisasi penilaian ujian siswa atau mahasiswa secara efisien, cepat, dan akurat. Dalam projek ini, penilaian essay baru didasarkan pada soal IELTS

## Model Machine Learning

 Model Machine Learning yang digunakan adalah XGBoost yang berbasis multitask learning yang dideploy di hugging face. Model machine learning dapat diakses di link berikut : https://huggingface.co/spaces/farwew/End-Point-EILTS/tree/main dengan link notebook : https://www.kaggle.com/code/jiryanfarokhi/bdc-internal-satria-data. Model yang dideploy kemudian dipanggil melalui api dengan integrasi dari server Supabase. Setiap user menjawab soal, model akan menilai jawaban siswa dan memberikan nilai otomatis dalam 4 aspek yaitu Task Achievement, Coherence and Cohesion, Lexical Resource, Grammatical Range. Sebelum menilai jawaban, model embedding bekerja untuk mentransformasi teks ke dalam format vektor menggunakan Sentence Transformers Vectorization berbasis all-mpnet-base-v2. Proses embedding dan penilaian jawaban dilakukan di setiap soal begitu seterusnya sampai soal terakhir. Terakhir nilai user keseluruhan akan ditampilkan secara langsung setelah menjawab soal. Link demo dapat diakses : https://igras.vercel.app/

## FrontEnd
- Dibangun menggunakan Next.js (lihat file seperti next.config.ts, src/app/, dan tsconfig.json).
- Menggunakan TypeScript dan Tailwind CSS untuk styling (lihat tailwind.config.js dan globals.css).
- Struktur halaman dan komponen ada di folder src/app/ dan src/app/components/.
- Halaman utama, dashboard, login, signup, dan exam diatur dalam subfolder page.tsx.
- Interaksi UI seperti navbar, theme-toggle, dan about-us diatur sebagai komponen terpisah.

## Backend
- API backend diatur melalui route handler Next.js di src/app/api/.
- Terdapat endpoint untuk autentikasi (login, logout, register, session) dan exam.
- Backend menggunakan Supabase untuk autentikasi dan database (lihat src/app/lib/supabase/).
- Logika autentikasi server-side ada di src/app/lib/server/auth.ts.

## Referensi
Dadi, Ramesh (2023). A Multitask Learning System for Trait-based Automated Short Answer Scoring. International Journal of Advanced Computer Science and Applications. DOI:10.14569/IJACSA.2023.0141048
https://sbert.net/

## Potensi Improvement
- Penambahan model machine learning untuk pemberian feedback dari jawaban user (Automated Writing Evaluation (AWE))
- Penambahan fitur untuk jenis soal selain IELTS semisal perhitungan matematis ataupun definisi serta konsep ilmiah
- Integrasi dengan web ujian sistem sekolah atau universitas

![alt text](<Screenshot 2025-09-29 164748.png>)
![alt text](<Screenshot 2025-10-05 134656.png>)
![alt text](<Screenshot 2025-10-19 105904.png>)