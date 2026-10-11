-- The campus study programs are fixed reference data, not sample data, so
-- every database gets them, the campus server included.
INSERT INTO study_programs (name) VALUES
  ('Akuntansi Sektor Publik STR'),
  ('D3 Akuntansi'),
  ('D3 Kebendaharaan Negara'),
  ('D3 Kepabeanan dan Cukai'),
  ('D3 Manajemen Aset'),
  ('D3 PBB/Penilai'),
  ('D3 Pajak'),
  ('Manajemen Aset Publik STR'),
  ('Manajemen Keuangan Negara STR')
ON CONFLICT (name) DO NOTHING;
