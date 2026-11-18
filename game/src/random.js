export function createRng(seed) {
  let t = seed >>> 0;
  return {
    next() {
      t += 0x6D2B79F5;
      let z = t;
      z = Math.imul(z ^ (z >>> 15), z | 1);
      z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    },
    range(min, max) {
      return min + this.next() * (max - min);
    },
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    pick(arr) {
      if (!arr || arr.length === 0) return undefined;
      return arr[this.int(0, arr.length - 1)];
    }
  };
}
