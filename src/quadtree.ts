const MAX_OBJECTS = 10;
const MAX_LEVELS = 4;

export type Quads = [Quadtree, Quadtree, Quadtree, Quadtree];
export type Rect = { x: number; y: number; w: number; h: number; [_: string]: any };

export function pointWithin(px: number, py: number, rlft: number, rtop: number, rrgt: number, rbtm: number) {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

export class Quadtree {
  o: Rect[];
  q: Quads | null;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public l = 0
  ) {
    this.o = [];
    this.q = null;
  }

  split() {
    const x = this.x;
    const y = this.y;
    const w = this.w / 2;
    const h = this.h / 2;
    const l = this.l + 1;

    this.q = [
      new Quadtree(x + w, y, w, h, l),
      new Quadtree(x, y, w, h, l),
      new Quadtree(x, y + h, w, h, l),
      new Quadtree(x + w, y + h, w, h, l),
    ];
  }

  quads(x: number, y: number, w: number, h: number, cb: (q: Quadtree) => void) {
    const q = this.q!;
    const hzMid = this.x + this.w / 2;
    const vtMid = this.y + this.h / 2;
    const startIsNorth = y < vtMid;
    const startIsWest = x < hzMid;
    const endIsEast = x + w > hzMid;
    const endIsSouth = y + h > vtMid;

    startIsNorth && endIsEast && cb(q[0]);
    startIsWest && startIsNorth && cb(q[1]);
    startIsWest && endIsSouth && cb(q[2]);
    endIsEast && endIsSouth && cb(q[3]);
  }

  add(o: Rect) {
    if (this.q != null) {
      this.quads(o.x, o.y, o.w, o.h, (q) => {
        q.add(o);
      });
    } else {
      const os = this.o;

      os.push(o);

      if (os.length > MAX_OBJECTS && this.l < MAX_LEVELS) {
        this.split();

        for (let i = 0; i < os.length; i++) {
          const oi = os[i];

          this.quads(oi.x, oi.y, oi.w, oi.h, (q) => {
            q.add(oi);
          });
        }

        this.o.length = 0;
      }
    }
  }

  get(x: number, y: number, w: number, h: number, cb: (o: Rect) => void) {
    for (let i = 0; i < this.o.length; i++) {
      cb(this.o[i]);
    }

    if (this.q != null) {
      this.quads(x, y, w, h, (q) => {
        q.get(x, y, w, h, cb);
      });
    }
  }

  clear() {
    this.o.length = 0;
    this.q = null;
  }
}
