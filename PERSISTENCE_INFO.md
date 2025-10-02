# State Persistence - Snake Game

## Fitur

Game Ular Tangga sekarang memiliki fitur **auto-save** menggunakan `localStorage`. Semua state game akan otomatis tersimpan dan dapat di-restore setelah refresh browser.

## State yang Disimpan

- **Players**: posisi, nama, status finished, rank, shield
- **Selected Player**: pemain yang sedang dipilih
- **Steps**: jumlah langkah dadu
- **Board Size**: ukuran papan
- **Show Name Input**: status modal input nama
- **Next Rank**: ranking berikutnya
- **Show Final Modal**: status modal final leaderboard
- **Markers**: pemetaan sel dengan marker tantangan (? dan !) - **POSISI TETAP SAMA**
- **Checkpoint Cells**: daftar sel checkpoint - **POSISI TETAP SAMA**
- **Cell Questions**: mapping pertanyaan per sel - **PERTANYAAN TETAP SAMA PER SEL**
- **Used Question IDs**: ID pertanyaan yang sudah digunakan
- **Visited Checkpoints**: checkpoint yang sudah dikunjungi per player

## Cara Kerja

### Auto-Save

State akan otomatis disimpan ke `localStorage` setiap kali ada perubahan pada:

- Posisi player berubah
- Nama player diubah
- Player finish
- Shield didapat/hilang
- Dan perubahan state penting lainnya

### Auto-Load

Saat halaman di-refresh atau dibuka kembali:

1. Store akan otomatis membaca data dari `localStorage`
2. Semua state akan di-restore ke kondisi terakhir
3. Deck pertanyaan akan di-load ulang jika game sedang berjalan

### Reset

Saat user menekan tombol **Reset** di menu game:

1. **localStorage dihapus** (clear saved state)
2. **Deck pertanyaan di-reload** dari file (ambil pertanyaan terbaru)
3. **Marker dan checkpoint di-generate ulang** (posisi random baru)
4. **Pertanyaan di-assign ulang** ke semua markers (random assignment baru)
5. Semua state player kembali ke default
6. Nama player kembali ke "Kelompok 1", "Kelompok 2", "Kelompok 3"

## Technical Details

### Storage Key

```javascript
const STORAGE_KEY = 'snakesLadders_gameState'
```

### Helper Functions

- `saveToStorage(state)`: Menyimpan state ke localStorage
- `loadFromStorage()`: Membaca state dari localStorage
- `clearStorage()`: Menghapus state dari localStorage

### Implementation Location

File: `src/stores/snakesLadders.js`

## Keuntungan

✅ Game state tetap tersimpan saat refresh browser  
✅ Tidak perlu khawatir kehilangan progress  
✅ Bisa melanjutkan game kapan saja  
✅ Reset hanya terjadi saat user memang ingin reset  
✅ **Posisi marker "!" dan "?" tetap sama** setelah refresh  
✅ **Pertanyaan per sel tetap sama** setelah refresh  
✅ **Checkpoint cells tetap di posisi yang sama**  
✅ **Garansi minimal 1 marker per baris** - setiap baris pasti ada tantangan  
✅ **Tidak ada pertanyaan duplikat** dalam 1 board game

## Detail Penting: Markers & Questions

### ✅ Jaminan: Tidak Ada Pertanyaan Duplikat dalam 1 Board

**Sistem memastikan dalam 1 game board, tidak ada 2 sel yang menggunakan pertanyaan yang sama (baris yang sama dari file).**

Algoritma assignment:

1. **Shuffle deck** pertanyaan untuk random distribution
2. **Track pertanyaan yang sudah digunakan** (usedQuestionIds Set)
3. **Assign pertanyaan unik** ke setiap sel marker/checkpoint
4. **Fallback warning** jika jumlah sel > jumlah pertanyaan available

### Posisi Marker Tetap Konsisten (saat Refresh)

Saat pertama kali game dimulai:

- Sistem generate marker "?" (optional) dan "!" (forced) dengan **2 GARANSI**:
  - ✅ **GARANSI 1: Minimal 1 marker per baris** (setiap baris pasti ada tantangan)
  - ✅ **GARANSI 2: Jumlah "?" dan "!" adalah 50:50** (atau mendekati jika ganjil)
  - Random tambahan ~1/3 dari sel eligible tersebar di board
  - Posisi marker random, tapi tipe (? atau !) di-split merata
- **Posisi ini disimpan ke localStorage**
- Saat refresh, posisi marker **tidak di-generate ulang**
- Marker tetap di sel yang sama seperti sebelum refresh

**Contoh untuk board 7x7:**
- Row 1-7: Masing-masing minimal 1 marker (7 guaranteed)
- Additional: ~10-12 marker random tersebar
- **Total: ~17-19 markers** per game
- **Split: ~8-9 marker "?" dan ~8-10 marker "!"** (tepat 50:50)

### Pertanyaan Per Sel Tetap Sama (saat Refresh)

- Setiap sel marker/checkpoint memiliki pertanyaan yang sudah di-map
- **Mapping pertanyaan per sel disimpan ke localStorage**
- Saat refresh, pertanyaan **tidak di-shuffle ulang**
- Sel yang sama akan menampilkan pertanyaan yang sama

### Reload Pertanyaan Saat Reset

Ketika tombol **Reset** ditekan:

- **Deck pertanyaan di-reload** dari file `pertanyaan-snake-ladder.txt`
- Jika Anda mengedit file pertanyaan, perubahan akan terdeteksi setelah reset
- **Posisi marker di-randomize ulang** (beda dari sebelumnya)
- **Assignment pertanyaan ke sel di-random ulang** (pertanyaan berbeda per sel)
- **Jaminan unique tetap berlaku** - tidak ada duplikat di board baru

### Reassignment Saat Pertanyaan Diganti

#### Perbedaan Behavior: Checkpoint vs Marker

| Kondisi | Checkpoint (🏁) | Marker "?" atau "!" |
|---------|----------------|---------------------|
| **Jawab Benar** | Ganti soal ✅ | Ganti soal ✅ |
| **Jawab Salah 1x** | **Langsung ganti soal** ✅ | Opsi disabled, soal tetap ⚠️ |
| **Jawab Salah 2x** | - | Ganti soal ✅ |

**Checkpoint lebih strict**: Sekali salah langsung ganti soal (tidak ada kesempatan kedua).

**Marker lebih forgiving**: Boleh salah 2x, opsi yang salah di-disable untuk attempt berikutnya.

#### Prioritas Pemilihan Pertanyaan Pengganti

Saat pertanyaan diganti:

1. ✅ **Priority 1**: Pertanyaan yang belum pernah ditanyakan DAN tidak digunakan sel lain
2. ✅ **Priority 2**: Pertanyaan yang tidak digunakan sel lain (boleh sudah pernah ditanyakan)
3. ⚠️ **Priority 3**: Pertanyaan yang berbeda dari saat ini (allow duplikat jika terpaksa)
4. ⚠️ **Fallback**: Gunakan pertanyaan pertama (dengan console warning)

**Sistem akan selalu mencoba mempertahankan uniqueness per board sampai prioritas terakhir.**

### Auto-Detection

Function `init()` memiliki auto-detection:

```javascript
const hasRestoredData =
  Object.keys(markers.value).length > 0 &&
  checkpointCells.value.length > 0 &&
  Object.keys(cellQuestions.value).length > 0
```

Jika data sudah ada (dari restore), system **skip generate baru**.

## Catatan

- Data disimpan di browser localStorage (per domain)
- Jika localStorage penuh/error, game tetap berjalan normal tanpa persistence
- Clear browser data akan menghapus saved state
- Console log akan menampilkan info:
  - Saat restore: jumlah markers, checkpoints, dan cellQuestions
  - Saat assign: `totalCells`, `uniqueQuestions`, `availableQuestions`
  - Warning jika ada pertanyaan yang reused karena tidak cukup unique questions

### ⚠️ Perhatian: Jumlah Pertanyaan

**Pastikan jumlah pertanyaan di file ≥ jumlah sel marker + checkpoint di board.**

Contoh perhitungan (board 7x7 = 49 sel):

- **Markers**: ~17-19 sel (7 guaranteed per row + ~10-12 additional random)
- **Checkpoints**: ~2-3 sel (checkpoint di awal baris tertentu)
- **Total challenge cells: ~19-22 sel**
- **Minimal pertanyaan required: 22 baris** (untuk aman)

Dengan sistem garansi 1 marker per baris, jumlah challenge cells lebih banyak dari sebelumnya.

Jika jumlah pertanyaan < jumlah sel, console akan menampilkan warning:

```
[SnakesLadders] Not enough unique questions! Reusing question ID: xxx
```

**File saat ini memiliki 40 pertanyaan**, cukup untuk board 7x7 dengan margin yang baik (40 > 22). ✅

## Update Pertanyaan

Jika Anda ingin mengupdate/mengganti pertanyaan di game:

1. **Edit file**: `src/assets/data/pertanyaan-snake-ladder.txt`
2. **Format**: `Pertanyaan | Opsi A | Opsi B | Opsi C | Opsi D | Kunci(A/B/C/D)`
3. **Simpan** file
4. **Tekan tombol Reset** di game
5. ✅ Game akan reload pertanyaan baru dan assign random ke markers

**Catatan**: Refresh browser **tidak akan** memuat pertanyaan baru (masih pakai yang lama dari localStorage). Harus reset untuk ambil pertanyaan terbaru dari file.
