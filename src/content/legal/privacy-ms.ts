import type { LegalDocument } from "./types";

/*
 * Notis Privasi / Privacy policy — BAHASA MALAYSIA — DRAFT TRANSLATION.
 * CR-2026-10-02-0628 (founder, 2026-10-02: "fix these as per best practices";
 * option (a): the assistant drafts it for review).
 *
 * UNPUBLISHED ON PURPOSE. status is "draft", the version is DRAFT-MS-…, and
 * nothing imports this module: there is no route, no link from /privacy and no
 * sitemap entry. The English document (privacy.ts, published 2026-10-02) is the
 * one in force. This text is an assistant-written translation, NOT reviewed by
 * a Malaysian translator or counsel; the Personal Data Protection Act 2010
 * requires the notice in the national language as well as English, so it must
 * be corrected and approved by the founder before it goes live.
 *
 * Mirrors privacy.ts one-to-one (16 sections, the same paragraph and bullet
 * counts) — tests/unit/privacy-ms-draft.test.ts guards that, so the two cannot
 * drift apart silently. Change privacy.ts and this file together.
 * Terms used: Akta Perlindungan Data Peribadi 2010 (PDPA); pengguna data (data
 * user); Pesuruhjaya Perlindungan Data Peribadi; Jabatan Perlindungan Data
 * Peribadi.
 */

export const privacyPolicyMs: LegalDocument = {
  key: "privacy",
  title: "Dasar privasi",
  version: "DRAFT-MS-2026-10-03",
  status: "draft",
  lastUpdated: "2026-10-03",
  summary:
    "Apakah data peribadi yang dikumpul oleh Data & AI Academy, mengapa, dengan siapa ia dikongsi, di mana ia mungkin disimpan, berapa lama ia disimpan, dan hak anda di bawah Akta Perlindungan Data Peribadi 2010.",
  sections: [
    {
      heading: "1. Siapa yang bertanggungjawab ke atas data anda",
      paragraphs: [
        "Portal Data & AI Academy dikendalikan oleh Your Partner Technologies, sebuah amalan latihan di Kuala Lumpur, Malaysia (nombor pendaftaran perniagaan 202401023226 (1569075-K); alamat berdaftar 15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur, Malaysia). Your Partner Technologies menentukan bagaimana dan mengapa data peribadi anda diproses, dan merupakan pengguna data bagi maksud Akta Perlindungan Data Peribadi 2010.",
        "Pertanyaan mengenai dasar ini, atau mengenai data anda, hendaklah dihantar kepada Pegawai Hubungan Perlindungan Data kami melalui halaman Hubungi Kami (Contact Us) portal ini.",
      ],
    },
    {
      heading: "2. Apa yang kami kumpul",
      paragraphs: [
        "Kami hanya mengumpul apa yang diperlukan oleh portal untuk menjalankan akaun, pendaftaran dan sijil anda. Secara khusus:",
        "Pembelajaran Percuma — membaca topik buku dan mengambil diagnostik kemahiran percuma — adalah berbeza: ia tidak memerlukan akaun, dan kami tidak mengumpul apa-apa. Soalan diagnostik dan jawapan anda hanya disimpan dalam pelayar anda sendiri dan tidak pernah dihantar kepada kami.",
      ],
      bullets: [
        "Butiran akaun — nama, alamat e-mel dan kata laluan anda. Kata laluan disimpan hanya sebagai cincangan sehala; kami tidak dapat membacanya.",
        "Butiran profil — negara yang anda nyatakan sebagai tempat anda berada. Ini menentukan mata wang yang dikenakan kepada anda (lihat Terma perkhidmatan).",
        "Pendaftaran — tawaran yang telah anda daftar, status pendaftaran itu, serta kehadiran dan penyempurnaan seperti yang direkodkan oleh jurulatih.",
        "Pesanan — apa yang anda bayar, dalam mata wang apa, bila, melalui jenis kaedah apa (contohnya \"kad\"), dan rujukan pembayaran yang diberikan oleh pemproses pembayaran kami, sama ada untuk pendaftaran, pembukaan kunci dokumen keputusan Semakan Pengetahuan atau pembayaran sokongan. Kami tidak pernah menerima atau menyimpan nombor kad anda.",
        "Percubaan Semakan Penilaian Percuma — jika anda mengambilnya, 200 soalan yang dipaparkan kepada anda, jawapan yang anda berikan, bila anda bermula dan tamat, markah anda, sama ada anda lulus dan gred anda, serta ID keputusan. Ini memerlukan akaun; ia bukan diagnostik (lihat di atas).",
        "Pendaftaran minat — jika anda mendaftarkan minat anda terhadap sesuatu format latihan: latihan dan format tersebut, alamat e-mel yang anda berikan (wajib) dan, jika anda memilih untuk memberikannya, nama penuh, nombor telefon bimbit dan tarikh lahir anda; yuran yang anda bayar atau bahawa ia telah dikecualikan, dan sama ada jurulatih telah memaklumkan anda tentang sesuatu tarikh. Anda menanda, sebelum mendaftar, bahawa jurulatih boleh menghubungi anda.",
        "Percubaan penilaian temu duga — jika anda mengambilnya, soalan yang dipaparkan kepada anda, jawapan anda, bila anda bermula dan tamat, dan markah anda. Jika anda mengambil ujian saringan sesebuah organisasi, nama dan alamat e-mel anda, peranan, markah anda dan masa yang anda ambil turut dikongsi dengan organisasi itu — anda mengesahkannya sebelum bermula. Ini memerlukan akaun.",
        "Persetujuan — versi Terma perkhidmatan dan dasar ini yang telah anda terima, dan bilakah.",
        "Sijil — jika satu dikeluarkan, nama anda seperti yang tertera pada sijil, latihan dan formatnya, tarikh penyempurnaan, pengeluaran dan tamat tempoh, pengecam sijil, sebarang pembaharuan yang anda bayar, dan sama ada anda telah memilih untuk disenaraikan dalam carian nama awam (lihat bahagian 6).",
        "Entri audit — rekod tindakan penting pada akaun anda (seperti log masuk, pertukaran kata laluan, pendaftaran atau bayaran balik), dengan cap masa, disimpan supaya kami dapat menyiasat masalah dan menunjukkan apa yang berlaku.",
        "Mesej — apa yang anda tulis kepada kami melalui halaman Hubungi Kami (nama, alamat e-mel, organisasi anda jika diberikan, perkara mesej itu, latihan yang berkaitan jika ada, halaman tempat anda menulis, dan mesej anda) dan apa-apa yang anda hantar kepada kami melalui e-mel, supaya kami dapat membalas.",
      ],
    },
    {
      heading: "3. Mengapa kami menggunakannya, dan asas undang-undang",
      paragraphs: [
        "Kami memproses data peribadi anda untuk tujuan berikut. Dalam setiap kes, pemprosesan itu diperlukan untuk melaksanakan perjanjian kami dengan anda, untuk memenuhi kewajipan undang-undang, atau dilakukan dengan persetujuan anda, yang anda berikan apabila anda mencipta akaun dan menerima dasar ini.",
      ],
      bullets: [
        "Untuk mencipta dan menjalankan akaun anda, dan membolehkan anda log masuk dengan selamat.",
        "Untuk menerima dan mengesahkan pendaftaran anda bagi sesuatu tawaran, dan menyampaikan latihan kepada anda.",
        "Untuk menerima pembayaran, mengeluarkan resit, memproses bayaran balik dan menyimpan rekod kewangan yang dikehendaki oleh undang-undang.",
        "Untuk menentukan mata wang dan harga yang terpakai kepada anda, berdasarkan negara profil anda.",
        "Untuk merekodkan penyempurnaan dan, jika diperoleh, mengeluarkan dan mengesahkan Sijil Penyempurnaan anda.",
        "Untuk menjalankan Semakan Penilaian Percuma yang anda ambil, menandanya, memberi anda keputusan yang boleh disahkan dan — jika anda lulus — sijil bergred, dan, jika anda membayar untuk membukanya, untuk menunjukkan kepada anda Sijil Pencapaian yang boleh dicetak.",
        "Untuk merekodkan minat yang anda daftarkan terhadap sesuatu format latihan, supaya jurulatih dapat merancang latihan itu, dan menghubungi anda mengenainya apabila ia dijadualkan.",
        "Untuk menjalankan penilaian temu duga yang anda ambil, menandanya dan menunjukkan jawapan model kepada anda; dan, bagi ujian saringan sesebuah organisasi, untuk memberikan keputusan anda kepada organisasi itu selepas anda mengesahkan bahawa anda bersetuju.",
        "Untuk menghantar mesej yang diperlukan oleh perkhidmatan — pengesahan, peringatan, perubahan pada sesuatu tawaran, resit dan notis mengenai akaun anda. Ini bukan pemasaran.",
        "Untuk menjawab pertanyaan anda dan menyelesaikan aduan.",
        "Untuk memastikan portal selamat, mencegah penyalahgunaan dan menyiasat masalah.",
        "Untuk mematuhi undang-undang, termasuk undang-undang cukai dan perlindungan pengguna.",
      ],
    },
    {
      heading: "4. Pemasaran",
      paragraphs: [
        "Kami tidak menghantar mesej pemasaran melainkan anda telah memilih secara berasingan untuk menerimanya. Jika anda memilih untuk menerimanya, setiap e-mel pemasaran mempunyai cara untuk anda berhenti menerimanya, dan anda juga boleh berhenti dengan menulis kepada kami melalui halaman Hubungi Kami (Contact Us) portal ini. Berhenti menerima pemasaran tidak menghentikan mesej perkhidmatan yang diterangkan di atas, yang anda perlukan untuk menghadiri apa yang telah anda daftar.",
      ],
    },
    {
      heading: "5. Dengan siapa kami berkongsi",
      paragraphs: [
        "Kami tidak menjual data peribadi, dan kami tidak berkongsinya untuk pemasaran pihak lain. Kami mendedahkan data peribadi hanya seperti berikut:",
      ],
      bullets: [
        "Stripe — pemproses pembayaran kami. Apabila anda membayar, anda memasukkan butiran pembayaran terus kepada Stripe, yang memproses pembayaran itu di bawah dasar privasinya sendiri. Kami menerima pengesahan pembayaran, bukan butiran kad anda.",
        "DigitalOcean — penyedia pengehosan kami. Pelayan dan pangkalan data tempat portal dan datanya dijalankan dihoskan oleh DigitalOcean di New York, Amerika Syarikat.",
        "HostGator — hos e-mel kami. Portal menghantar e-melnya (pengesahan akaun, makluman penerimaan dan balasan kepada mesej anda, serta notis perkhidmatan) melalui peti mel yang dihoskan oleh HostGator, yang oleh itu mengendalikan alamat penghantar dan penerima serta teks mesej tersebut.",
        "Jurulatih bagi sesuatu tawaran yang anda daftar — nama dan alamat e-mel anda, supaya kehadiran dan penyempurnaan dapat direkodkan dan anda dapat dibenarkan masuk ke sesi.",
        "Jurulatih bagi sesuatu latihan yang anda daftarkan minat, dan pentadbir kami — butiran yang anda berikan semasa mendaftar minat (alamat e-mel, dan nama, nombor telefon bimbit serta tarikh lahir anda jika anda memberikannya), supaya mereka dapat merancang latihan itu dan menghantar e-mel kepada anda mengenai jadualnya. Butiran ini tidak dikongsi dengan sesiapa lain, dan jurulatih hanya melihat orang yang berminat terhadap latihan mereka sendiri.",
        "Organisasi yang ujian saringannya anda ambil — nama, alamat e-mel, peranan, markah dan masa yang anda ambil, dan hanya selepas anda mengesahkan, sebelum bermula, bahawa keputusan itu dikongsi dengan organisasi tersebut. Organisasi itu menentukan apa yang akan dilakukan dengannya di bawah amalan privasinya sendiri; ia hanya melihat keputusan calonnya sendiri.",
        "HRD Corp atau majikan anda — hanya jika anda meminta kami menyediakan bukti kehadiran atau penyempurnaan anda, contohnya untuk menyokong tuntutan latihan, dan hanya apa yang diperlukan untuk tujuan itu. Tuntutan HRD Corp adalah untuk warganegara Malaysia dan biasanya dibuat melalui majikan yang berdaftar dengan HRD Corp.",
        "Pihak berkuasa — apabila undang-undang menghendaki kami mendedahkan, contohnya kepada mahkamah, pengawal selia atau agensi penguatkuasaan undang-undang yang bertindak dalam kuasanya.",
      ],
    },
    {
      heading: "6. Pengesahan awam",
      paragraphs: [
        "Jika anda dikeluarkan Sijil Penyempurnaan, sesiapa yang mempunyai pengecam sijil itu, atau pautan kepadanya, boleh mengesahkan di portal ini bahawa sijil itu tulen. Pengesahan melalui pengecam atau pautan sentiasa berfungsi. Halaman pengesahan menunjukkan nama pada sijil, latihan dan formatnya, tarikh penyempurnaan, tarikh pengeluaran, tarikh tamat tempoh dan status semasa sijil. Jika sijil telah dibatalkan, halaman itu menyatakannya.",
        "Portal juga menawarkan carian awam mengikut nama. Carian itu hanya memaparkan pemegang yang telah memilih untuk disenaraikan di dalamnya. Disenaraikan adalah pilihan dan ditutup melainkan anda menghidupkannya dari akaun anda. Apabila anda menghidupkannya, kami merekodkan pilihan itu, bersama perkataan yang anda setujui dan masanya. Anda boleh menarik baliknya pada bila-bila masa dari akaun anda, dan penarikan balik itu berkuat kuasa serta-merta bagi carian nama; pengecam dan pautan terus berfungsi.",
        "Keputusan Semakan Penilaian Percuma mempunyai halaman pengesahannya sendiri, yang hanya boleh dicapai melalui ID atau pautannya sendiri — ia tidak pernah dipaparkan oleh carian nama di atas. Ia menunjukkan nama pada keputusan, markah, sama ada lulus, gred dan tarikh, dan menyatakan dengan jelas bahawa ia bukan Sijil Penyempurnaan dan bukan kelayakan yang diperoleh Akademi.",
        "Sama ada dicapai melalui pengecam, pautan atau carian nama, halaman pengesahan tidak pernah menunjukkan alamat e-mel anda, negara anda, butiran hubungan anda atau sebarang butiran dokumen pengenalan diri. Tarikh padanya ialah tarikh kalendar dalam waktu Malaysia (Asia/Kuala_Lumpur).",
        "Jika anda mempunyai kebimbangan tentang bagaimana sijil atau keputusan Semakan Penilaian Percuma anda boleh disahkan, tulis kepada kami melalui halaman Hubungi Kami (Contact Us) portal ini.",
      ],
    },
    {
      heading: "7. Di mana data anda disimpan, dan pemindahan ke luar Malaysia",
      paragraphs: [
        "Portal dihoskan oleh DigitalOcean pada pelayan di New York, Amerika Syarikat. Data peribadi anda oleh itu disimpan dan diproses di luar Malaysia, dan pemproses pembayaran serta hos e-mel kami juga mungkin memproses data di luar Malaysia.",
        "Apabila pemindahan ke luar Malaysia berlaku, kami akan bergantung pada salah satu asas yang dibenarkan oleh seksyen 129 Akta Perlindungan Data Peribadi 2010 (seperti yang dipinda) — seperti persetujuan anda, pemindahan itu diperlukan untuk melaksanakan perjanjian kami dengan anda, atau penerima terikat untuk melindungi data itu pada tahap yang sekurang-kurangnya setara dengan Akta — dan kami akan meletakkan perlindungan kontrak dan teknikal yang sewajarnya.",
      ],
    },
    {
      heading: "8. Bagaimana kami memastikannya selamat",
      paragraphs: [
        "Kami mengambil langkah praktikal untuk melindungi data peribadi anda daripada kehilangan, penyalahgunaan, akses tanpa kebenaran, pindaan dan pendedahan, selaras dengan Prinsip Keselamatan. Ini termasuk:",
      ],
      bullets: [
        "Penyulitan data semasa penghantaran antara pelayar anda dengan portal (HTTPS).",
        "Kata laluan disimpan hanya sebagai cincangan sehala bergaram, tidak pernah dalam bentuk yang boleh dibaca.",
        "Butiran kad dan bank dikendalikan oleh Stripe, tidak pernah oleh portal.",
        "Kawalan akses, supaya kakitangan dan jurulatih hanya melihat apa yang diperlukan oleh peranan mereka.",
        "Log audit bagi tindakan penting pada akaun dan rekod.",
        "Penyedia yang dipilih dan dikontrakkan untuk melindungi data yang mereka proses untuk kami.",
      ],
    },
    {
      heading: "9. Jika sesuatu tidak kena",
      paragraphs: [
        "Jika berlaku pelanggaran data peribadi yang berkemungkinan menyebabkan kemudaratan yang ketara kepada anda, kami akan memberitahu Pesuruhjaya Perlindungan Data Peribadi dan individu yang terjejas seperti yang dikehendaki oleh Akta Perlindungan Data Peribadi 2010 (seperti yang dipinda pada 2024), dan kami akan memberitahu anda apa yang berlaku, data apa yang terlibat dan apa yang sedang kami lakukan mengenainya.",
      ],
    },
    {
      heading: "10. Berapa lama kami menyimpannya",
      paragraphs: [
        "Kami menyimpan data peribadi hanya selama yang diperlukan untuk tujuan di atas, dan kemudian memadam atau menganonimkannya, selaras dengan Prinsip Penyimpanan. Tempoh yang kami terapkan ialah:",
      ],
      bullets: [
        "Butiran akaun dan profil — selagi akaun anda dibuka, dan selama 30 hari selepas anda menutupnya supaya akaun yang ditutup boleh dipulihkan jika penutupannya satu kesilapan.",
        "Rekod pendaftaran dan penyempurnaan — selagi sijil yang disokongnya boleh disahkan, dan selama tujuh tahun selepas ia dikeluarkan atau tamat tempoh.",
        "Rekod pesanan dan pembayaran — selama tujuh tahun, tempoh yang dikehendaki oleh undang-undang cukai Malaysia untuk menyimpan rekod kewangan.",
        "Rekod persetujuan — selagi akaun wujud dan selama enam tahun selepas itu (tempoh had), supaya kami dapat menunjukkan apa yang anda setujui.",
        "Entri audit — selama dua tahun, tempoh yang mencukupi untuk menyiasat insiden keselamatan dan pertikaian.",
        "Mesej yang anda hantar kepada kami — sehingga pertanyaan anda diselesaikan dan selama dua belas bulan selepas itu.",
      ],
    },
    {
      heading: "11. Memastikan ia tepat",
      paragraphs: [
        "Selaras dengan Prinsip Integriti Data, kami bergantung kepada anda untuk memastikan nama, alamat e-mel dan negara anda tepat, dan anda boleh mengubahnya di kawasan akaun anda pada bila-bila masa. Nama anda hendaklah dimasukkan seperti yang anda mahu ia tertera pada sijil. Jika anda perasan kesilapan dalam sesuatu rekod yang kami simpan, beritahu kami dan kami akan membetulkannya.",
      ],
    },
    {
      heading: "12. Hak anda",
      paragraphs: [
        "Di bawah Akta Perlindungan Data Peribadi 2010 (seperti yang dipinda) anda mempunyai hak berikut. Untuk menggunakan mana-mana daripadanya, tulis kepada Pegawai Hubungan Perlindungan Data kami melalui halaman Hubungi Kami (Contact Us) portal ini. Kami mungkin meminta anda mengesahkan identiti anda terlebih dahulu, dan kami akan membalas dalam tempoh yang dibenarkan oleh Akta.",
      ],
      bullets: [
        "Akses — untuk meminta salinan data peribadi yang kami simpan tentang anda. Akta membenarkan fi yang sederhana untuk ini; kami akan memberitahu anda sebelum mengenakannya.",
        "Pembetulan — untuk membetulkan data yang tidak tepat, tidak lengkap, mengelirukan atau lapuk.",
        "Penarikan balik persetujuan — untuk menarik balik persetujuan terhadap pemprosesan yang bergantung padanya, melalui notis bertulis. Memandangkan sesetengah pemprosesan diperlukan untuk menjalankan akaun dan pendaftaran anda, menarik balik persetujuan mungkin bermakna kami tidak lagi dapat menyediakan perkhidmatan; kami akan memberitahu anda jika itu berlaku.",
        "Mencegah pemprosesan yang berkemungkinan menyebabkan tekanan — untuk menghendaki kami menghentikan pemprosesan yang menyebabkan, atau berkemungkinan menyebabkan, kerosakan atau tekanan yang tidak wajar dan ketara.",
        "Pemasaran — untuk menghendaki kami berhenti menggunakan data anda untuk pemasaran langsung.",
        "Aduan — jika anda tidak berpuas hati dengan maklum balas kami, anda boleh membuat aduan kepada Pesuruhjaya Perlindungan Data Peribadi Malaysia (Jabatan Perlindungan Data Peribadi).",
      ],
    },
    {
      heading: "13. Kuki",
      paragraphs: [
        "Portal menggunakan sebilangan kecil kuki dan entri storan pelayar, yang kesemuanya diperlukan agar ia berfungsi atau untuk mengingati pilihan. Tiada satu pun digunakan untuk pengiklanan, dan kami tidak menggunakan kuki penjejakan atau analitik pihak ketiga.",
      ],
      bullets: [
        "Kuki sesi — memastikan anda kekal log masuk semasa berpindah antara halaman. Ia dipadam apabila anda log keluar atau apabila sesi tamat tempoh.",
        "Pilihan tema — mengingati sama ada anda memilih paparan cerah atau gelap. Ia tidak mengandungi data peribadi.",
        "Pembayaran — apabila anda membayar, Stripe mungkin menetapkan kukinya sendiri pada halaman pembayarannya untuk mengesan penipuan dan melengkapkan pembayaran; ini dikawal oleh dasar privasi Stripe.",
      ],
    },
    {
      heading: "14. Kanak-kanak",
      paragraphs: [
        "Portal ini ditujukan kepada orang dewasa. Kami tidak dengan sengaja mengumpul data peribadi daripada sesiapa yang berumur di bawah 18 tahun dan Terma perkhidmatan kami menghendaki anda berumur sekurang-kurangnya 18 tahun untuk mencipta akaun. Jika anda percaya seseorang yang berumur di bawah 18 tahun telah mencipta akaun, beritahu kami melalui halaman Hubungi Kami (Contact Us) portal ini dan kami akan memadam akaun itu.",
      ],
    },
    {
      heading: "15. Perubahan pada dasar ini",
      paragraphs: [
        "Kami mungkin mengubah dasar ini — contohnya, apabila kami mengesahkan penyedia pengehosan kami, menambah latihan atau perlu mencerminkan perubahan dalam undang-undang. Versi semasa, nombor versinya dan tarikh berkuat kuasanya dipaparkan pada halaman ini. Jika sesuatu perubahan menjejaskan secara ketara cara kami menggunakan data anda, kami akan memberitahu anda melalui e-mel atau apabila anda log masuk seterusnya, dan jika undang-undang menghendakinya kami akan meminta persetujuan anda semula.",
      ],
    },
    {
      heading: "16. Hubungi kami",
      paragraphs: [
        "Your Partner Technologies (nombor pendaftaran perniagaan 202401023226 (1569075-K)), 15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur, Malaysia.",
        "Perlindungan data: Pegawai Hubungan Perlindungan Data, melalui halaman Hubungi Kami (Contact Us) portal ini.",
        "Tarikh berkuat kuasa versi ini: (draf — belum diterbitkan). Versi: DRAFT-MS-2026-10-03.",
      ],
    },
  ],
};
