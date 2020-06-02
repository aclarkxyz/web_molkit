// fixes that are broken with regard to TypeScript importing

///<reference path='../decl/jquery/index.d.ts'/>

interface Path2D 
{
    addPath(path:Path2D, transform?:SVGMatrix):void;
    closePath():void;
    moveTo(x:number, y:number):void;
    lineTo(x:number, y:number):void;
    bezierCurveTo(cp1x:number, cp1y:number, cp2x:number, cp2y:number, x:number, y:number):void;
    quadraticCurveTo(cpx:number, cpy:number, x:number, y:number):void;
    arc(x:number, y:number, radius:number, startAngle:number, endAngle:number, anticlockwise?:boolean):void;
    arcTo(x1:number, y1:number, x2:number, y2:number, radius:number):void;
    /*ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;*/
    rect(x:number, y:number, w:number, h:number):void;
}

/* both of these seem to be fixed in TypeScript
interface Path2DConstructor 
{
    new ():Path2D;
    new (d:string):Path2D;
    new (path:Path2D, fillRule?:string):Path2D;
    prototype:Path2D;
}
//declare var Path2D:Path2DConstructor;
//declare var Path2D:{new (path?:Path2D): string|Path2D; prototype: Path2D;};
*/

/* ... these seem to have been fixed
interface CanvasRenderingContext2D 
{
    fill(path?:Path2D):void;
    stroke(path?:Path2D):void;
    clip(path?:Path2D, fillRule?:string):void;
    ellipse(cx:number, cy:number, radX:number, radY:number, rotation:number, startAngle:number, endAngle:number, anticlockwise:boolean):void; 
}*/

interface JQueryEventObject
{
	shiftKey:boolean;
	ctrlKey:boolean;
	altKey:boolean;

    // typos in interface (oops!)
    isImmediatePropagationStopped():boolean;
    isPropagationStopped():boolean;
}

interface String
{
   startsWith(str:string):boolean;
   endsWith(str:string):boolean;
}

/*interface Set<T> 
{
    add(value:T):Set<T>;
    clear():void;
    delete(value:T):boolean;
    entries(): Array<[T, T]>;
    forEach(callbackfn:(value: T, index: T, set: Set<T>) => void, thisArg?: any):void;
    has(value:T):boolean;
    keys():Array<T>;
    size:number;
}

interface SetConstructor 
{
    new <T>():Set<T>;
    new <T>(iterable:Array<T>):Set<T>;
    prototype:Set<any>;
}
declare var Set:SetConstructor;*/
