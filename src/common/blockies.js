/**
 * Identicon to distinguish addresses
 * Based on codes from
 * https://github.com/ethereum/blockies/blob/master/blockies.js and
 * https://github.com/bpeters/react-native-blockies-svg/blob/master/index.js
 * Example:
 * import blockies from "../common/blockies.js";
 * const icon = blockies.create({ // All options are optional
 *    seed: 'randstring', // seed used to generate icon data, default: random
 *    color: '#dfe', // to manually specify the icon color, default: random
 *    bgcolor: '#aaa', // choose a different background color, default: random
 *    size: 15, // width/height of the icon in blocks, default: 8
 *    scale: 3, // width/height of each block in pixels, default: 4
 *    spotcolor: '#000' // each pixel has a 13% chance of being of a third color,
 *    // default: random. Set to -1 to disable it. These "spots" create structures
 *    // that look like eyes, mouths and noses.
 * });
**/
export class Blockies {
  // The random number is a js implementation of the Xorshift PRNG
  randseed;

  constructor () {
    this.randseed = new Array(4); // Xorshift: [x, y, z, w] 32 bit values
  }

  seedrand(seed) {
    for (let i = 0; i < this.randseed.length; i++) {
      this.randseed[i] = 0;
    }

    for (let i = 0; i < seed.length; i++) {
      this.randseed[i%4] = ((this.randseed[i%4] << 5) - this.randseed[i%4]) + seed.charCodeAt(i);
    }
  }

  rand() {
    const t = this.randseed[0] ^ (this.randseed[0] << 11);

    this.randseed[0] = this.randseed[1];
    this.randseed[1] = this.randseed[2];
    this.randseed[2] = this.randseed[3];
    this.randseed[3] = (this.randseed[3] ^ (this.randseed[3] >> 19) ^ t ^ (t >> 8));

    return (this.randseed[3]>>>0) / ((1 << 31)>>>0);
  }

  createColor() {
    const h = Math.floor(this.rand() * 360);
    const s = ((this.rand() * 60) + 40) + '%';
    const l = ((this.rand() + this.rand() + this.rand() + this.rand()) * 25) + '%';

    return 'hsl(' + h + ',' + s + ',' + l + ')';
  }

  createImageData(size) {
    const width = size;
    const height = size;

    const dataWidth = Math.ceil(width / 2);
    const mirrorWidth = width - dataWidth;

    const data = [];

    for (let y = 0; y < height; y++) {
      let row = [];

      for (let x = 0; x < dataWidth; x++) {
        row[x] = Math.floor(this.rand()*2.3);
      }

      let r = row.slice(0, mirrorWidth);

      r.reverse();

      row = row.concat(r);

      for (let i = 0; i < row.length; i++) {
        data.push(row[i]);
      }
    }

    return data;
  }

  renderIcon(opts) {
    const imageData = this.createImageData(opts.size);
    const width = Math.sqrt(imageData.length);

    return imageData.map((item, i) => {
      let fill = opts.bgcolor;

      if (item) {
        if (item === 1) {
          fill = opts.color;
        } else {
          fill = opts.spotcolor;
        }
      }

      let row = Math.floor(i / opts.size);
      let col = i % opts.size;

      return `<rect key="${i}" x="${row * opts.scale}" y="${col * opts.scale}" width="${opts.scale}" height="${opts.scale}" fill="${fill}"/>`;
    });
  }

  buildOpts(opts) {
    var newOpts = {};

    newOpts.seed = opts.seed || Math.floor((Math.random()*Math.pow(10,16))).toString(16);

    this.seedrand(newOpts.seed);

    newOpts.size = opts.size || 8;
    newOpts.scale = opts.scale || 4;
    newOpts.color = opts.color || this.createColor();
    newOpts.bgcolor = opts.bgcolor || this.createColor();
    newOpts.spotcolor = opts.spotcolor || this.createColor();

    return newOpts;
  }

  createIcon(opts) {
    opts = this.buildOpts(opts || {});
    return (
      `<svg width="${opts.size * opts.scale}"
            height="${opts.size * opts.scale}"
            viewBox="0 0 ${opts.size * opts.scale} ${opts.size * opts.scale}"
            xmlns="http://www.w3.org/2000/svg">
          ${this.renderIcon(opts)}
       </svg>`
    );
  }
}
