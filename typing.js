const text = ["Computer Science Student","Developer","Tech Enthusiast"];
let index = 0;
let char = 0;

function type() {
  const element = document.querySelector(".typing");
  element.innerHTML = text[index].slice(0,char);
  char++;

  if(char > text[index].length){
    index = (index + 1) % text.length;
    char = 0;
  }
  
  setTimeout(type, 120);
}
type();
