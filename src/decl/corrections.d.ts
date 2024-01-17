// fixes that are broken with regard to TypeScript importing

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

interface String
{
   startsWith(str:string):boolean;
   endsWith(str:string):boolean;
}

