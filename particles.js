const canvas = document.getElementById("bg");
const c = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

function Particle(){
  this.x = Math.random()*canvas.width;
  this.y = Math.random()*canvas.height;
  this.size = Math.random()*2+1;
  this.speedX = (Math.random()*0.4)-0.2;
  this.speedY = (Math.random()*0.4)-0.2;
}

Particle.prototype.update = function(){
  this.x+=this.speedX;
  this.y+=this.speedY;

  if(this.size>0.2) this.size-=0.01;
}

Particle.prototype.draw = function(){
  c.fillStyle="#00ff99";
  c.beginPath();
  c.arc(this.x,this.y,this.size,0,Math.PI*2);
  c.fill();
};

function init(){
  for(let i=0;i<200;i++){
    particles.push(new Particle());
  }
}
init();

function animate(){
  c.clearRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<particles.length;i++){
    particles[i].update();
    particles[i].draw();
  }
  requestAnimationFrame(animate);
}
animate();
