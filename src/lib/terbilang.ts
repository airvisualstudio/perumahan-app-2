/**
 * Helper to convert numerical Indonesian Rupiah into formal written words.
 * Example: 45000000 -> "Empat Puluh Lima Juta Rupiah"
 */
export function terbilangRupiah(n: number): string {
  if (isNaN(n) || n === 0) return "Nol Rupiah";

  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  const konversi = (x: number): string => {
    let result = "";
    x = Math.floor(x);

    if (x < 12) {
      result = " " + angka[x];
    } else if (x < 20) {
      result = konversi(x - 10) + " Belas";
    } else if (x < 100) {
      result = konversi(Math.floor(x / 10)) + " Puluh" + konversi(x % 10);
    } else if (x < 200) {
      result = " Seratus" + konversi(x - 100);
    } else if (x < 1000) {
      result = konversi(Math.floor(x / 100)) + " Ratus" + konversi(x % 100);
    } else if (x < 2000) {
      result = " Seribu" + konversi(x - 1000);
    } else if (x < 1000000) {
      result = konversi(Math.floor(x / 1000)) + " Ribu" + konversi(x % 1000);
    } else if (x < 1000000000) {
      result = konversi(Math.floor(x / 1000000)) + " Juta" + konversi(x % 1000000);
    } else if (x < 1000000000000) {
      result = konversi(Math.floor(x / 1000000000)) + " Miliar" + konversi(x % 1000000000);
    } else {
      result = konversi(Math.floor(x / 1000000000000)) + " Triliun" + konversi(x % 1000000000000);
    }

    return result;
  };

  const raw = konversi(Math.abs(n)).trim();
  return raw ? `${raw} Rupiah` : "Nol Rupiah";
}
