import { Loc, LocPOD } from "./loc";
import { Rect, RectPOD } from "./rect";
import { produce, Draft } from "immer";

export type Matrix2dPOD<T> = Readonly<{
    rect: RectPOD;
    data: Readonly<T[][]>;
}>;

export class Matrix2d {

    static create<T>(size: LocPOD, initializer: (loc: LocPOD) => T): Matrix2dPOD<T> {
        const rect = Rect.create(Loc.ZERO, size);
        const data = Rect.travasalLoc(rect, initializer);
        return {
            rect, data
        }
    }

    static getElement<T>(mat: Matrix2dPOD<T>, [x, y]: LocPOD): T {
        return mat.data[y][x];
    }

    static setElement<T>(mat: Matrix2dPOD<T>, [x, y]: LocPOD, element: Draft<T>): Matrix2dPOD<T> {
        return produce(mat, (mat) => {
            mat.data[y][x] = element;
        });
    }

    static traversal<T>(mat: Matrix2dPOD<T>, visitor: (value: T, loc: LocPOD) => void) {
        Rect.travasalLoc(mat.rect, ([x, y]) => {
            visitor(mat.data[y][x], [x, y])
        });
    }

    static spliceX() {

    }
}
