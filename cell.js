class Cell {
    constructor(x0, y0, r, angle){
        this.r = r;  
        this.angle = angle;
        this.x0 = x0;
        this.y0 = y0;


        this.x = this.r * cos(this.angle);
        this.y = this.r * sin(this.angle);
    }

    update(){
        this.x = this.r * cos(this.angle);
        this.y = this.r * sin(this.angle);
        this.angle += 0.05;
    }

    display(){
        ellipse(this.x0 + this.x, this.y0 + this.y, 10, 10); 
        stroke(249, 243, 204);
    }
}
