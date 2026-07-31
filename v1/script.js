
// let filtered = filterRange(arr, 1, 4);

// alert( filtered ); // 3,1 (совпадающие значения)

// alert( arr ); // 5,3,8,1 (без изменений)

let s = "list-style-image".split("-");

let otvet = s.map((item, index) => {
    return index === 0 ? item : item[0].toUpperCase() + item.slice();
}).join("")


let arr = [5, 3, 8, 1];
let it = arr.filter(item => item >= 1 && item <= 4);

console.log(it);