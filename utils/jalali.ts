
/*
  Jalaali JavaScript utilities
  Based on jalaali-js algorithms
*/

interface JalaaliDate {
  jy: number;
  jm: number;
  jd: number;
}

interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

export const toJalaali = (gy: number, gm: number, gd: number): JalaaliDate => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
};

export const toGregorian = (jy: number, jm: number, jd: number): GregorianDate => {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return { gy, gm, gd };
};

export const jalaaliMonthLength = (jy: number, jm: number): number => {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Leap year calculation
  const breaks =  [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  let jp = breaks[0];
  let jump = 0;
  let jumpMin = -14; // arbitrary large negative number
  
  // Find the jump range
  for(let i=1; i<bl; i++) {
      const jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) {
          jumpMin = jy - jp;
          break;
      }
      jp = jm;
  }
  
  // Calculate n (year index in cycle)
  let n = jy - jp;
  
  if (jumpMin !== -14) {
      n = jumpMin;
  } else {
      n = jy - jp; // Fallback/continuation logic simplified for standard range
  }

  // Simplified Leap logic for common years (works for standard range 1300-1500)
  // For a robust production app, full `jalaali-js` lib is better, but this suffices for UI rendering.
  // Using a simpler checker:
  // ((((jy % 33) * 8) + 10) / 33) remainder is < 8? No, that's for another algo.
  
  // Let's use the standard algo for leap year check:
  const isLeap = ((((jy + 12) % 33) % 4) === 1) ? false : (((jy + 12) % 33) % 4 === 0) ? false: false; // Wait, simplest way:
  
  // Using standard JS date for leap check via conversion
  const d1 = toGregorian(jy, 12, 30);
  const d2 = toJalaali(d1.gy, d1.gm, d1.gd);
  if (d2.jm === 1 && d2.jd === 1) return 29; // If 12/30 becomes 1/1, then Esfand has 29 days.
  
  // Actually, let's just check via date diff
  const firstNextYear = toGregorian(jy + 1, 1, 1);
  const firstThisYear = toGregorian(jy, 1, 1);
  const daysInYear = (new Date(firstNextYear.gy, firstNextYear.gm - 1, firstNextYear.gd).getTime() - 
                      new Date(firstThisYear.gy, firstThisYear.gm - 1, firstThisYear.gd).getTime()) / (1000 * 3600 * 24);
  
  return daysInYear === 366 ? 30 : 29;
};

// Helper to pad numbers
const pad = (n: number) => n < 10 ? `0${n}` : n;

// Get ISO string from Jalali
export const jalaliToIso = (jy: number, jm: number, jd: number): string => {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${gy}-${pad(gm)}-${pad(gd)}`;
};

// Get Jalali from Date object
export const getJalaliFromDate = (date: Date) => {
  return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
};
